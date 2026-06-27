'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';

export type Result = { error?: string; ok?: boolean } | null;

async function getCentroOrFail(userId: string, centroIdFromForm?: string | null): Promise<string> {
  const admin = createSupabaseAdmin();
  if (centroIdFromForm) {
    const { data } = await admin.from('responsables')
      .select('id')
      .eq('centro_id', centroIdFromForm)
      .eq('usuario_auth_id', userId)
      .maybeSingle();
    if (!data) throw new Error('No sos responsable de ese centro.');
    return centroIdFromForm;
  }
  const { data } = await admin.from('responsables')
    .select('centro_id')
    .eq('usuario_auth_id', userId)
    .limit(1)
    .maybeSingle();
  if (!data) throw new Error('No tenés centro asignado.');
  return data.centro_id;
}

export async function addPersonal(_prev: Result, formData: FormData): Promise<Result> {
  try {
    const user = await getSessionUser();
    if (!user) return { error: 'No autenticado.' };

    const centro_id_form = String(formData.get('centro_id') ?? '') || null;
    const centro_id = await getCentroOrFail(user.id, centro_id_form);

    const nombre = String(formData.get('nombre') ?? '').trim();
    const cedula = String(formData.get('cedula') ?? '').trim() || null;
    const cargo = String(formData.get('cargo') ?? '').trim() || null;
    if (!nombre) return { error: 'Nombre es obligatorio.' };

    const admin = createSupabaseAdmin();
    const { error } = await admin.from('centro_personal').insert({
      centro_id, nombre, cedula, cargo
    });
    if (error) return { error: error.message };

    revalidatePath('/dashboard/centro/personal');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function togglePersonal(_prev: Result, formData: FormData): Promise<Result> {
  try {
    const user = await getSessionUser();
    if (!user) return { error: 'No autenticado.' };
    const id = String(formData.get('id') ?? '');
    const activo = formData.get('activo') === 'on';

    const admin = createSupabaseAdmin();
    const { data: row } = await admin.from('centro_personal').select('centro_id').eq('id', id).maybeSingle();
    if (!row) return { error: 'Persona no encontrada.' };
    await getCentroOrFail(user.id, row.centro_id);

    await admin.from('centro_personal').update({ activo }).eq('id', id);
    revalidatePath('/dashboard/centro/personal');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
