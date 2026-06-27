'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';

export type Result = { error?: string; ok?: boolean } | null;

async function ownsCentro(userId: string, centroId: string): Promise<boolean> {
  const admin = createSupabaseAdmin();
  const { data } = await admin.from('responsables')
    .select('id').eq('centro_id', centroId).eq('usuario_auth_id', userId).maybeSingle();
  return !!data;
}

export async function asignar(_prev: Result, formData: FormData): Promise<Result> {
  try {
    const user = await getSessionUser();
    if (!user) return { error: 'No autenticado.' };

    const personal_id = String(formData.get('personal_id') ?? '');
    const vehiculo_id = String(formData.get('vehiculo_id') ?? '');
    if (!personal_id || !vehiculo_id) return { error: 'Faltan datos.' };

    const admin = createSupabaseAdmin();
    const [{ data: p }, { data: v }] = await Promise.all([
      admin.from('centro_personal').select('centro_id').eq('id', personal_id).maybeSingle(),
      admin.from('centros_camiones').select('centro_id').eq('id', vehiculo_id).maybeSingle()
    ]);
    if (!p || !v) return { error: 'Registros no encontrados.' };
    if (p.centro_id !== v.centro_id) return { error: 'Personal y vehículo de centros distintos.' };
    if (!(await ownsCentro(user.id, p.centro_id)) && user.rol !== 'super_admin') {
      return { error: 'No autorizado.' };
    }

    const { error } = await admin.from('centro_personal_vehiculo').insert({
      personal_id, vehiculo_id, activo: true
    });
    if (error) {
      if (/duplicate key/i.test(error.message)) return { error: 'Ya existe esa asignación.' };
      return { error: error.message };
    }

    revalidatePath('/dashboard/centro/asignaciones');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function desasignar(_prev: Result, formData: FormData): Promise<Result> {
  try {
    const user = await getSessionUser();
    if (!user) return { error: 'No autenticado.' };
    const id = String(formData.get('id') ?? '');

    const admin = createSupabaseAdmin();
    const { data } = await admin.from('centro_personal_vehiculo')
      .select('personal_id, centro_personal:personal_id(centro_id)')
      .eq('id', id).maybeSingle();
    const centro = (data?.centro_personal ?? null) as { centro_id: string } | null;
    if (!centro) return { error: 'No encontrada.' };
    if (!(await ownsCentro(user.id, centro.centro_id)) && user.rol !== 'super_admin') {
      return { error: 'No autorizado.' };
    }

    await admin.from('centro_personal_vehiculo').delete().eq('id', id);
    revalidatePath('/dashboard/centro/asignaciones');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
