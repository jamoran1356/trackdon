'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase/server';
import { checkUsernamePolicy, policyMessage } from '@/lib/username-policy';

type Result = { error?: string; ok?: boolean } | null;

export async function changeMyPassword(_prev: Result, formData: FormData): Promise<Result> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado.' };

  const current = String(formData.get('current_password') ?? '');
  const next = String(formData.get('new_password') ?? '');
  const confirm = String(formData.get('confirm_password') ?? '');

  if (next.length < 8) return { error: 'La nueva password debe tener al menos 8 caracteres.' };
  if (next !== confirm) return { error: 'Las passwords no coinciden.' };

  const { error: signErr } = await supabase.auth.signInWithPassword({
    email: user.email ?? '',
    password: current
  });
  if (signErr) return { error: 'Password actual incorrecta.' };

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: error.message };

  revalidatePath('/cuenta');
  return { ok: true };
}

export async function changeMyEmail(_prev: Result, formData: FormData): Promise<Result> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado.' };

  const newEmail = String(formData.get('new_email') ?? '').trim().toLowerCase();
  const current = String(formData.get('current_password') ?? '');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return { error: 'Email inválido.' };

  const { error: signErr } = await supabase.auth.signInWithPassword({
    email: user.email ?? '',
    password: current
  });
  if (signErr) return { error: 'Password incorrecta.' };

  const admin = createSupabaseAdmin();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    email: newEmail,
    email_confirm: true
  });
  if (error) return { error: error.message };

  revalidatePath('/cuenta');
  return { ok: true };
}

export async function changeMyUsername(_prev: Result, formData: FormData): Promise<Result> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado.' };

  const newUsername = String(formData.get('username') ?? '').trim().toLowerCase();
  const policy = checkUsernamePolicy(newUsername);
  const admin = createSupabaseAdmin();

  if (!policy.ok) {
    if (policy.reason === 'blocked_word' || policy.reason === 'reserved') {
      // Usuario ya autenticado intentando setear algo prohibido → autoban.
      await admin.from('perfiles').update({
        banned_at: new Date().toISOString(),
        banned_motivo: `Intento de username prohibido: "${newUsername}" (${policy.reason})`
      }).eq('id', user.id);
      await admin.auth.admin.updateUserById(user.id, { ban_duration: '876000h' }).catch(() => {});
      await supabase.auth.signOut();
      return { error: 'Tu cuenta ha sido suspendida por intentar usar un nombre no permitido.' };
    }
    return { error: policyMessage(policy.reason) };
  }

  const { data: taken } = await admin
    .from('perfiles')
    .select('id')
    .ilike('username', newUsername)
    .neq('id', user.id)
    .maybeSingle();
  if (taken) return { error: 'Ese nombre de usuario ya está en uso.' };

  const { error } = await admin.from('perfiles').update({ username: newUsername }).eq('id', user.id);
  if (error) return { error: error.message };

  revalidatePath('/cuenta');
  revalidatePath('/admin/cuenta');
  return { ok: true };
}

export async function changeMyNombreReal(_prev: Result, formData: FormData): Promise<Result> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado.' };

  const nombreReal = String(formData.get('nombre_real') ?? '').trim();
  if (nombreReal.length > 0 && nombreReal.length < 2) {
    return { error: 'Nombre real muy corto.' };
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from('perfiles')
    .update({ nombre_real: nombreReal || null })
    .eq('id', user.id);
  if (error) return { error: error.message };

  revalidatePath('/cuenta');
  revalidatePath('/admin/cuenta');
  return { ok: true };
}

export async function changeMyName(_prev: Result, formData: FormData): Promise<Result> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado.' };

  const nombre = String(formData.get('nombre') ?? '').trim();
  if (nombre.length < 2) return { error: 'Nombre muy corto.' };

  const admin = createSupabaseAdmin();
  const { error } = await admin.from('perfiles').update({ nombre_mostrado: nombre }).eq('id', user.id);
  if (error) return { error: error.message };

  revalidatePath('/cuenta');
  revalidatePath('/admin/cuenta');
  return { ok: true };
}
