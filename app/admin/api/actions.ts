'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase/server';
import { generateApiKey, VALID_SCOPES } from '@/lib/api-keys';

export type CreateState = { error?: string; plainKey?: string } | null;

async function requireSuperAdmin(): Promise<string> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');
  const { data: p } = await supabase.from('perfiles').select('rol').eq('id', user.id).single();
  if (p?.rol !== 'super_admin') throw new Error('Acceso denegado');
  return user.id;
}

export async function createApiKey(_prev: CreateState, formData: FormData): Promise<CreateState> {
  try {
    const me = await requireSuperAdmin();
    const name = String(formData.get('name') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim() || null;
    const scopesRaw = formData.getAll('scopes').map(String);
    const scopes = scopesRaw.filter((s) => VALID_SCOPES.includes(s));
    if (scopes.length === 0) scopes.push('read');

    const expiraStr = String(formData.get('expira_at') ?? '').trim();
    const expira_at = expiraStr ? new Date(expiraStr).toISOString() : null;

    if (name.length < 3) return { error: 'Nombre obligatorio (≥3 chars).' };

    const { plain, prefix, hash } = generateApiKey();
    const admin = createSupabaseAdmin();
    const { error } = await admin.from('api_keys').insert({
      name, description, key_prefix: prefix, key_hash: hash,
      scopes, creado_por_auth_id: me, expira_at
    });
    if (error) return { error: error.message };

    revalidatePath('/admin/api');
    return { plainKey: plain };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

type Result = { error?: string; ok?: boolean } | null;

export async function revokeApiKey(_prev: Result, formData: FormData): Promise<Result> {
  try {
    await requireSuperAdmin();
    const id = String(formData.get('id') ?? '');
    if (!id) return { error: 'Falta id.' };
    const admin = createSupabaseAdmin();
    const { error } = await admin.from('api_keys')
      .update({ revocada_at: new Date().toISOString() }).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/api');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteApiKey(_prev: Result, formData: FormData): Promise<Result> {
  try {
    await requireSuperAdmin();
    const id = String(formData.get('id') ?? '');
    if (!id) return { error: 'Falta id.' };
    const admin = createSupabaseAdmin();
    const { error } = await admin.from('api_keys').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/api');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
