'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase/server';

type Result = { error?: string; ok?: boolean } | null;

async function requireSuperAdmin(): Promise<string> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');
  const { data: profile } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
  if (profile?.rol !== 'super_admin') throw new Error('Acceso denegado');
  return user.id;
}

export async function addPatrocinador(_prev: Result, formData: FormData): Promise<Result> {
  try {
    const me = await requireSuperAdmin();
    const empresa = String(formData.get('empresa') ?? '').trim();
    const logo_url = String(formData.get('logo_url') ?? '').trim();
    const url = String(formData.get('url') ?? '').trim() || null;
    const orden = parseInt(String(formData.get('orden') ?? '0'), 10) || 0;

    if (!empresa || !logo_url) return { error: 'Empresa y logo son obligatorios.' };
    if (!/^https?:\/\//.test(logo_url)) return { error: 'Logo URL debe empezar con http(s)://' };
    if (url && !/^https?:\/\//.test(url)) return { error: 'URL del patrocinador debe empezar con http(s)://' };

    const admin = createSupabaseAdmin();
    const { error } = await admin.from('patrocinadores').insert({
      empresa, logo_url, url, orden, activo: true, creado_por_auth_id: me
    });
    if (error) return { error: error.message };

    revalidatePath('/admin/patrocinadores');
    revalidatePath('/');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function togglePatrocinador(_prev: Result, formData: FormData): Promise<Result> {
  try {
    await requireSuperAdmin();
    const id = String(formData.get('id') ?? '');
    const activo = formData.get('activo') === 'on';
    if (!id) return { error: 'Falta id.' };

    const admin = createSupabaseAdmin();
    const { error } = await admin.from('patrocinadores').update({ activo }).eq('id', id);
    if (error) return { error: error.message };

    revalidatePath('/admin/patrocinadores');
    revalidatePath('/');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deletePatrocinador(_prev: Result, formData: FormData): Promise<Result> {
  try {
    await requireSuperAdmin();
    const id = String(formData.get('id') ?? '');
    if (!id) return { error: 'Falta id.' };

    const admin = createSupabaseAdmin();
    const { error } = await admin.from('patrocinadores').delete().eq('id', id);
    if (error) return { error: error.message };

    revalidatePath('/admin/patrocinadores');
    revalidatePath('/');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
