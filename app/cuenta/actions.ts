'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase/server';

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

  // Verificar password actual
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
  return { ok: true };
}
