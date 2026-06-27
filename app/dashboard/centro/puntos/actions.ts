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

export async function addPunto(_prev: Result, formData: FormData): Promise<Result> {
  try {
    const user = await getSessionUser();
    if (!user) return { error: 'No autenticado.' };
    const centro_id = String(formData.get('centro_id') ?? '');
    if (!centro_id) return { error: 'Falta centro.' };
    if (!(await ownsCentro(user.id, centro_id)) && user.rol !== 'super_admin') {
      return { error: 'No eres responsable de ese centro.' };
    }
    const nombre = String(formData.get('nombre') ?? '').trim();
    const direccion = String(formData.get('direccion') ?? '').trim() || null;
    const horario = String(formData.get('horario') ?? '').trim() || null;
    const capacidad = String(formData.get('capacidad_estimada') ?? '').trim() || null;
    if (!nombre) return { error: 'Nombre del punto obligatorio.' };

    const admin = createSupabaseAdmin();
    const { error } = await admin.from('centros_puntos_recepcion').insert({
      centro_id, nombre, direccion, horario, capacidad_estimada: capacidad, activo: true
    });
    if (error) return { error: error.message };
    revalidatePath('/dashboard/centro/puntos');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function togglePunto(_prev: Result, formData: FormData): Promise<Result> {
  try {
    const user = await getSessionUser();
    if (!user) return { error: 'No autenticado.' };
    const id = String(formData.get('id') ?? '');
    const activo = formData.get('activo') === 'on';
    const admin = createSupabaseAdmin();
    const { data: row } = await admin.from('centros_puntos_recepcion').select('centro_id').eq('id', id).maybeSingle();
    if (!row) return { error: 'Punto no encontrado.' };
    if (!(await ownsCentro(user.id, row.centro_id)) && user.rol !== 'super_admin') {
      return { error: 'No autorizado.' };
    }
    await admin.from('centros_puntos_recepcion').update({ activo }).eq('id', id);
    revalidatePath('/dashboard/centro/puntos');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deletePunto(_prev: Result, formData: FormData): Promise<Result> {
  try {
    const user = await getSessionUser();
    if (!user) return { error: 'No autenticado.' };
    const id = String(formData.get('id') ?? '');
    const admin = createSupabaseAdmin();
    const { data: row } = await admin.from('centros_puntos_recepcion').select('centro_id').eq('id', id).maybeSingle();
    if (!row) return { error: 'Punto no encontrado.' };
    if (!(await ownsCentro(user.id, row.centro_id)) && user.rol !== 'super_admin') {
      return { error: 'No autorizado.' };
    }
    await admin.from('centros_puntos_recepcion').delete().eq('id', id);
    revalidatePath('/dashboard/centro/puntos');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
