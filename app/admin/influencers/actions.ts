'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase/server';

export type Result = { error?: string; ok?: boolean } | null;

const ESTADOS = ['ok', 'sospechoso', 'desactivado'];

async function requireSuperAdmin() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');
  const { data: p } = await supabase.from('perfiles').select('rol').eq('id', user.id).single();
  if (p?.rol !== 'super_admin') throw new Error('Acceso denegado');
  return user.id;
}

export async function setInfluencerRevision(_prev: Result, formData: FormData): Promise<Result> {
  try {
    await requireSuperAdmin();
    const id = String(formData.get('id') ?? '');
    const estado = String(formData.get('estado') ?? '');
    const motivo = String(formData.get('motivo') ?? '').trim() || null;
    if (!id || !ESTADOS.includes(estado)) return { error: 'Datos inválidos.' };
    if (estado !== 'ok' && !motivo) return { error: 'Motivo obligatorio cuando marcas sospechoso o desactivado.' };

    const admin = createSupabaseAdmin();
    const update: Record<string, unknown> = {
      revision_estado: estado,
      revision_motivo: motivo,
      revision_at: new Date().toISOString()
    };
    if (estado === 'desactivado') update.activo = false;
    if (estado === 'ok') update.activo = true;

    const { error } = await admin.from('influencers').update(update).eq('id', id);
    if (error) return { error: error.message };

    revalidatePath('/admin/influencers');
    revalidatePath('/');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
