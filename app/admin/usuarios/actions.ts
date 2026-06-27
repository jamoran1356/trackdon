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

const ROLES = ['donante', 'centro_admin', 'centro_responsable', 'influencer', 'validador', 'super_admin'];

export async function changeUserRole(_prev: Result, formData: FormData): Promise<Result> {
  try {
    const me = await requireSuperAdmin();
    const userId = String(formData.get('user_id') ?? '');
    const newRol = String(formData.get('rol') ?? '');
    if (!userId || !ROLES.includes(newRol)) return { error: 'Datos inválidos.' };
    if (userId === me && newRol !== 'super_admin') {
      return { error: 'No podés bajarte el rol a ti mismo.' };
    }

    const admin = createSupabaseAdmin();
    const { error } = await admin.from('perfiles').update({ rol: newRol }).eq('id', userId);
    if (error) return { error: error.message };

    revalidatePath('/admin/usuarios');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function toggleBan(_prev: Result, formData: FormData): Promise<Result> {
  try {
    const me = await requireSuperAdmin();
    const userId = String(formData.get('user_id') ?? '');
    const motivo = String(formData.get('motivo') ?? '').trim() || null;
    const action = String(formData.get('action') ?? '');
    if (!userId) return { error: 'Falta user_id.' };
    if (userId === me) return { error: 'No podés banearte a vos mismo.' };

    const admin = createSupabaseAdmin();
    if (action === 'ban') {
      await admin.from('perfiles').update({
        banned_at: new Date().toISOString(),
        banned_motivo: motivo
      }).eq('id', userId);
      // También invalidar sesión: ban duro = 100 años
      const banUntil = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
      await admin.auth.admin.updateUserById(userId, { ban_duration: '876000h' }).catch(() => {});
      void banUntil;
    } else {
      await admin.from('perfiles').update({
        banned_at: null,
        banned_motivo: null
      }).eq('id', userId);
      await admin.auth.admin.updateUserById(userId, { ban_duration: 'none' }).catch(() => {});
    }

    revalidatePath('/admin/usuarios');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function adminResetPassword(_prev: Result, formData: FormData): Promise<Result> {
  try {
    await requireSuperAdmin();
    const userId = String(formData.get('user_id') ?? '');
    const newPassword = String(formData.get('new_password') ?? '');
    if (!userId || newPassword.length < 8) return { error: 'Password ≥ 8 caracteres.' };

    const admin = createSupabaseAdmin();
    const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) return { error: error.message };

    revalidatePath('/admin/usuarios');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
