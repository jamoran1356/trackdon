'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServer } from '@/lib/supabase/server';

export type AuthState = { error?: string } | null;

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) return { error: 'Email y contraseña son obligatorios.' };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const nombre = String(formData.get('nombre') ?? '').trim();

  if (!email || !password || !nombre) {
    return { error: 'Todos los campos son obligatorios.' };
  }
  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  const supabase = await createSupabaseServer();
  // Triggers Supabase signup confirmation email containing a 6-digit OTP token.
  // The user MUST verify before being able to sign in.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre } }
  });
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  redirect(`/registro/verificar?email=${encodeURIComponent(email)}`);
}

export type OtpState = { error?: string; resent?: boolean } | null;

export async function verifyEmailOtp(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const token = String(formData.get('code') ?? '').replace(/\s+/g, '');

  if (!email || token.length < 6) {
    return { error: 'Pega el código de 6 dígitos que recibiste por correo.' };
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function resendEmailOtp(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email) return { error: 'Falta el correo.' };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.resend({ email, type: 'signup' });
  if (error) return { error: error.message };
  return { resent: true };
}

export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
