'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';

export type Result = { error?: string; ok?: boolean } | null;

const CATEGORIAS = [
  'combustible','mantenimiento_vehiculo','mano_de_obra','alquiler',
  'servicios','logistica','empaque','otros'
];

async function ownsCentro(userId: string, centroId: string): Promise<boolean> {
  const admin = createSupabaseAdmin();
  const { data } = await admin.from('responsables')
    .select('id').eq('centro_id', centroId).eq('usuario_auth_id', userId).maybeSingle();
  return !!data;
}

export async function addCosto(_prev: Result, formData: FormData): Promise<Result> {
  try {
    const user = await getSessionUser();
    if (!user) return { error: 'No autenticado.' };
    const centro_id = String(formData.get('centro_id') ?? '');
    if (!(await ownsCentro(user.id, centro_id)) && user.rol !== 'super_admin') {
      return { error: 'No eres responsable de ese centro.' };
    }
    const categoria = String(formData.get('categoria') ?? 'otros');
    if (!CATEGORIAS.includes(categoria)) return { error: 'Categoría inválida.' };
    const descripcion = String(formData.get('descripcion') ?? '').trim() || null;
    const monto_usd = parseFloat(String(formData.get('monto_usd') ?? '0'));
    if (!(monto_usd >= 0)) return { error: 'Monto inválido.' };
    const fecha = String(formData.get('fecha') ?? '').trim() || new Date().toISOString().slice(0, 10);

    const admin = createSupabaseAdmin();
    const { error } = await admin.from('centros_costos').insert({
      centro_id, categoria, descripcion, monto_usd, fecha,
      creado_por_auth_id: user.id
    });
    if (error) return { error: error.message };
    revalidatePath('/dashboard/centro');
    revalidatePath('/dashboard/centro/costos');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteCosto(_prev: Result, formData: FormData): Promise<Result> {
  try {
    const user = await getSessionUser();
    if (!user) return { error: 'No autenticado.' };
    const id = String(formData.get('id') ?? '');
    const admin = createSupabaseAdmin();
    const { data: row } = await admin.from('centros_costos').select('centro_id').eq('id', id).maybeSingle();
    if (!row) return { error: 'Costo no encontrado.' };
    if (!(await ownsCentro(user.id, row.centro_id)) && user.rol !== 'super_admin') {
      return { error: 'No autorizado.' };
    }
    await admin.from('centros_costos').delete().eq('id', id);
    revalidatePath('/dashboard/centro');
    revalidatePath('/dashboard/centro/costos');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
