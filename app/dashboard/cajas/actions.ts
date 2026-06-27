'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';

export type ActionState = { error?: string; ok?: boolean; cajaId?: string } | null;

const ESTADOS = ['borrador', 'sellada', 'recibida', 'en_camion', 'en_via', 'distribuida'] as const;
type Estado = typeof ESTADOS[number];

async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error('No autenticado');
  return user;
}

export async function crearCajaBorrador(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const titulo = String(formData.get('titulo') ?? '').trim() || null;
    const evento_id = String(formData.get('evento_id') ?? '').trim() || null;

    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from('cajas')
      .insert({ donante_auth_id: user.id, titulo, evento_id, estado: 'borrador' })
      .select('id')
      .single();
    if (error) return { error: error.message };

    revalidatePath('/dashboard/cajas');
    redirect(`/dashboard/cajas/${data.id}`);
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function agregarItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const caja_id = String(formData.get('caja_id') ?? '');
    const descripcion = String(formData.get('descripcion') ?? '').trim();
    const cantidad = parseFloat(String(formData.get('cantidad') ?? '0'));
    const unidad = String(formData.get('unidad') ?? 'unidad').trim();
    const subcategoria = String(formData.get('subcategoria') ?? '').trim() || null;
    const notas = String(formData.get('notas') ?? '').trim() || null;

    if (!caja_id || !descripcion) return { error: 'Faltan datos.' };
    if (!(cantidad > 0)) return { error: 'Cantidad inválida.' };

    const admin = createSupabaseAdmin();

    // Verificar ownership y que esté en borrador
    const { data: caja } = await admin
      .from('cajas')
      .select('id, donante_auth_id, estado')
      .eq('id', caja_id)
      .maybeSingle();
    if (!caja) return { error: 'Caja no encontrada.' };
    if (caja.donante_auth_id !== user.id) return { error: 'No es tu caja.' };
    if (caja.estado !== 'borrador') return { error: 'La caja ya está sellada; no podés agregar items.' };

    const { error } = await admin
      .from('caja_items')
      .insert({ caja_id, descripcion, cantidad, unidad, subcategoria, notas });
    if (error) return { error: error.message };

    revalidatePath(`/dashboard/cajas/${caja_id}`);
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function eliminarItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const item_id = String(formData.get('item_id') ?? '');
    if (!item_id) return { error: 'Falta item_id.' };

    const admin = createSupabaseAdmin();
    const { data: item } = await admin
      .from('caja_items')
      .select('caja_id, cajas:caja_id (donante_auth_id, estado)')
      .eq('id', item_id)
      .maybeSingle();
    const caja = (item?.cajas ?? null) as { donante_auth_id: string; estado: Estado } | null;
    if (!caja || caja.donante_auth_id !== user.id || caja.estado !== 'borrador') {
      return { error: 'No autorizado.' };
    }

    const { error } = await admin.from('caja_items').delete().eq('id', item_id);
    if (error) return { error: error.message };

    revalidatePath(`/dashboard/cajas/${item?.caja_id}`);
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function asignarCentro(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const caja_id = String(formData.get('caja_id') ?? '');
    const centro_id = String(formData.get('centro_id') ?? '').trim() || null;
    if (!caja_id) return { error: 'Falta caja.' };

    const admin = createSupabaseAdmin();
    const { data: caja } = await admin
      .from('cajas')
      .select('donante_auth_id, estado')
      .eq('id', caja_id)
      .maybeSingle();
    if (!caja || caja.donante_auth_id !== user.id) return { error: 'No autorizado.' };
    if (caja.estado !== 'borrador') return { error: 'Caja sellada; no se puede reasignar.' };

    const { error } = await admin
      .from('cajas')
      .update({ centro_destino_id: centro_id })
      .eq('id', caja_id);
    if (error) return { error: error.message };

    revalidatePath(`/dashboard/cajas/${caja_id}`);
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function sellarCaja(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const caja_id = String(formData.get('caja_id') ?? '');
    if (!caja_id) return { error: 'Falta caja.' };

    const admin = createSupabaseAdmin();
    const { data: caja } = await admin
      .from('cajas')
      .select('donante_auth_id, estado, centro_destino_id')
      .eq('id', caja_id)
      .maybeSingle();
    if (!caja || caja.donante_auth_id !== user.id) return { error: 'No autorizado.' };
    if (caja.estado !== 'borrador') return { error: 'Ya está sellada.' };
    if (!caja.centro_destino_id) return { error: 'Tenés que asignar un centro antes de sellar.' };

    const { count } = await admin
      .from('caja_items')
      .select('id', { count: 'exact', head: true })
      .eq('caja_id', caja_id);
    if (!count || count < 1) return { error: 'Agregá al menos 1 item antes de sellar.' };

    const { error } = await admin.from('cajas').update({ estado: 'sellada' }).eq('id', caja_id);
    if (error) return { error: error.message };

    revalidatePath(`/dashboard/cajas/${caja_id}`);
    revalidatePath('/dashboard/cajas');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
