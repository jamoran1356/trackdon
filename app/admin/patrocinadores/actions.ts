'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase/server';
import { uploadFile } from '@/lib/supabase/storage';

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
    const url = String(formData.get('url') ?? '').trim() || null;
    const orden = parseInt(String(formData.get('orden') ?? '0'), 10) || 0;

    if (!empresa) return { error: 'Nombre de la empresa es obligatorio.' };
    if (url && !/^https?:\/\//.test(url)) return { error: 'URL del patrocinador debe empezar con http(s)://' };

    // Logo: archivo subido O URL como fallback
    const logoFile = formData.get('logo_file') as File | null;
    const logoUrlInput = String(formData.get('logo_url') ?? '').trim() || null;

    let logo_url: string | null = null;
    if (logoFile && typeof logoFile === 'object' && logoFile.size > 0) {
      if (logoFile.size > 5 * 1024 * 1024) return { error: 'Logo demasiado grande (máx 5 MB).' };
      const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
      if (!allowed.includes(logoFile.type)) return { error: 'Formato de logo no permitido (png/jpg/webp/svg).' };
      try {
        const up = await uploadFile('avatares', logoFile, { subidoPorAuthId: me, pathPrefix: 'patrocinadores' });
        logo_url = up.publicUrl ?? null;
      } catch (e) {
        return { error: `No pude subir el logo: ${(e as Error).message}` };
      }
    } else if (logoUrlInput) {
      if (!/^https?:\/\//.test(logoUrlInput)) return { error: 'Logo URL debe empezar con http(s)://' };
      logo_url = logoUrlInput;
    }

    if (!logo_url) return { error: 'Adjunta un archivo de logo o pega una URL.' };

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
