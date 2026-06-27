'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';

async function ensureValidador() {
  const user = await getSessionUser();
  if (!user || !['validador', 'super_admin'].includes(user.rol)) {
    throw new Error('No autorizado');
  }
  const admin = createSupabaseAdmin();
  const { data: v } = await admin
    .from('validadores')
    .select('id')
    .eq('usuario_auth_id', user.id)
    .maybeSingle();
  return { admin, validadorId: v?.id ?? null, user };
}

export async function verificarInfluencer(formData: FormData) {
  const { admin, validadorId } = await ensureValidador();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await admin.from('influencers').update({
    verificado_at: new Date().toISOString(),
    verificado_por_validador_id: validadorId,
    rechazado_at: null,
    rechazado_motivo: null
  }).eq('id', id);
  revalidatePath('/dashboard/validador');
  revalidatePath('/publico');
}

export async function rechazarInfluencer(formData: FormData) {
  const { admin, validadorId } = await ensureValidador();
  const id = String(formData.get('id') ?? '');
  const motivo = String(formData.get('motivo') ?? '').trim() || 'Sin motivo especificado';
  if (!id) return;
  await admin.from('influencers').update({
    rechazado_at: new Date().toISOString(),
    rechazado_motivo: motivo,
    verificado_at: null,
    verificado_por_validador_id: validadorId
  }).eq('id', id);
  revalidatePath('/dashboard/validador');
}

export async function verificarRendicion(formData: FormData) {
  const { admin, validadorId } = await ensureValidador();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await admin.from('rendiciones').update({
    verificado_at: new Date().toISOString(),
    verificado_por_validador_id: validadorId,
    rechazado_at: null,
    rechazado_motivo: null
  }).eq('id', id);
  revalidatePath('/dashboard/validador');
  revalidatePath('/publico');
}

export async function rechazarRendicion(formData: FormData) {
  const { admin } = await ensureValidador();
  const id = String(formData.get('id') ?? '');
  const motivo = String(formData.get('motivo') ?? '').trim() || 'Sin comprobante adecuado';
  if (!id) return;
  await admin.from('rendiciones').update({
    rechazado_at: new Date().toISOString(),
    rechazado_motivo: motivo,
    verificado_at: null
  }).eq('id', id);
  revalidatePath('/dashboard/validador');
}

export async function marcarDenuncia(formData: FormData) {
  const { admin } = await ensureValidador();
  const id = String(formData.get('id') ?? '');
  const estado = String(formData.get('estado') ?? '');
  const resolucion = String(formData.get('resolucion') ?? '').trim() || null;
  if (!id || !['en_revision', 'resuelta', 'descartada'].includes(estado)) return;
  await admin.from('denuncias').update({ estado, resolucion }).eq('id', id);
  revalidatePath('/dashboard/validador');
}
