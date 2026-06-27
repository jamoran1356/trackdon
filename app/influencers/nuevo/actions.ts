'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { uploadFile } from '@/lib/supabase/storage';

export type InfState = { error?: string } | null;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
    .slice(0, 64);
}

function cleanHandle(h: string): string | null {
  const t = h.trim().replace(/^@+/, '');
  return t ? t : null;
}

export async function crearInfluencer(
  _prev: InfState,
  formData: FormData
): Promise<InfState> {
  const user = await getSessionUser();
  if (!user) redirect('/login?return_to=/influencers/nuevo');

  const nombre_publico = String(formData.get('nombre_publico') ?? '').trim();
  const slugRaw = String(formData.get('slug') ?? '').trim();
  const bio = String(formData.get('bio') ?? '').trim() || null;
  const evento_id = String(formData.get('evento_id') ?? '').trim() || null;
  const twitter_handle = cleanHandle(String(formData.get('twitter_handle') ?? ''));
  const instagram_handle = cleanHandle(String(formData.get('instagram_handle') ?? ''));
  const tiktok_handle = cleanHandle(String(formData.get('tiktok_handle') ?? ''));
  const youtube_handle = cleanHandle(String(formData.get('youtube_handle') ?? ''));
  const website_url = String(formData.get('website_url') ?? '').trim() || null;

  if (!nombre_publico || nombre_publico.length < 3) {
    return { error: 'El nombre público es obligatorio (mín 3 caracteres).' };
  }
  if (!evento_id) {
    return { error: 'Tienes que elegir el evento al que vas a recolectar.' };
  }

  const slug = slugRaw ? slugify(slugRaw) : slugify(nombre_publico);
  if (!slug) return { error: 'No se pudo generar slug a partir del nombre. Usa letras.' };

  const admin = createSupabaseAdmin();

  // Asegurar slug único
  const { data: existing } = await admin
    .from('influencers')
    .select('id').ilike('slug', slug).maybeSingle();
  if (existing) return { error: 'Ese slug ya está tomado. Prueba otro.' };

  // Un solo influencer por user (regla de producto)
  const { data: prev } = await admin
    .from('influencers')
    .select('id').eq('usuario_auth_id', user.id).maybeSingle();
  if (prev) return { error: 'Ya tienes un perfil de influencer. Edítalo desde tu dashboard.' };

  // Validador para vincular: primero activo
  const { data: validator } = await admin
    .from('validadores')
    .select('id').eq('activo', true).limit(1).maybeSingle();
  if (!validator) {
    return { error: 'No hay validadores configurados. Pídele a un admin que cree uno.' };
  }

  // Avatar (opcional)
  let avatar_url: string | null = null;
  const file = formData.get('avatar');
  if (file instanceof File && file.size > 0) {
    if (file.size > 2 * 1024 * 1024) return { error: 'El avatar excede 2 MB.' };
    try {
      const r = await uploadFile('avatares', file, {
        subidoPorAuthId: user.id,
        pathPrefix: `influencers/${user.id}`
      });
      avatar_url = r.publicUrl ?? null;
    } catch (e) {
      return { error: `No pude subir el avatar: ${(e as Error).message}` };
    }
  }

  const { error } = await admin.from('influencers').insert({
    usuario_auth_id: user.id,
    nombre_publico,
    slug,
    bio,
    avatar_url,
    twitter_handle,
    instagram_handle,
    tiktok_handle,
    youtube_handle,
    website_url,
    validador_id: validator.id,
    evento_id,
    activo: true
    // verificado_at queda NULL → pendiente de validador
  });
  if (error) return { error: error.message };

  // Promueve el rol a 'influencer'
  await admin.from('perfiles').update({ rol: 'influencer' }).eq('id', user.id);

  revalidatePath('/dashboard/influencer');
  revalidatePath('/publico');
  redirect('/dashboard/influencer');
}
