'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase/server';
import { sendEmail, otpEmailHtml, otpEmailText } from '@/lib/email';
import { generateOtp, hashOtp, otpExpiresAt, MAX_ATTEMPTS } from '@/lib/otp';

export type AuthState = { error?: string } | null;

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) return { error: 'Email y contraseña son obligatorios.' };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

/**
 * Solicita un código OTP custom: genera 6 dígitos, hashea, guarda en otp_codes
 * y manda el email vía Resend HTTP API (sin pasar por Supabase Auth).
 */
export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const nombre = String(formData.get('nombre') ?? '').trim();

  if (!email || !nombre) {
    return { error: 'Nombre y correo son obligatorios.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Correo inválido.' };
  }

  const admin = createSupabaseAdmin();

  // Check si el email ya tiene cuenta en auth.users
  const { data: existing } = await admin
    .from('auth.users' as any) // workaround: PostgREST no expone auth.users — usamos RPC alternativa
    .select('id')
    .eq('email', email)
    .maybeSingle()
    .catch(() => ({ data: null }));
  // Si el lookup directo no funciona (PostgREST no expone auth.users), seguimos.

  const code = generateOtp();
  const code_hash = hashOtp(code);
  const expires_at = otpExpiresAt().toISOString();

  const { error: insertErr } = await admin
    .from('otp_codes')
    .insert({ email, nombre, code_hash, expires_at });
  if (insertErr) {
    if (/Rate limit/i.test(insertErr.message)) {
      return { error: 'Demasiados códigos en las últimas 24 h. Esperá un rato.' };
    }
    return { error: insertErr.message };
  }

  const sent = await sendEmail(
    email,
    'trackdon · código de verificación',
    otpEmailHtml(code, nombre),
    otpEmailText(code, nombre)
  );
  if (!sent.ok) {
    return { error: `No pude enviar el correo: ${sent.error ?? 'desconocido'}` };
  }

  revalidatePath('/', 'layout');
  redirect(`/registro/verificar?email=${encodeURIComponent(email)}`);
}

export type OtpState = { error?: string; resent?: boolean } | null;

/**
 * Verifica el código OTP custom y crea el user en Supabase Auth + sesión.
 */
export async function verifyEmailOtp(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const token = String(formData.get('code') ?? '').replace(/\s+/g, '');
  const password = String(formData.get('password') ?? '');

  if (!email || token.length < 6) {
    return { error: 'Pega el código de 6 dígitos que recibiste por correo.' };
  }
  if (password.length < 8) {
    return { error: 'Elegí una contraseña de al menos 8 caracteres.' };
  }

  const admin = createSupabaseAdmin();
  const code_hash = hashOtp(token);

  // Buscar el OTP válido más reciente para ese email
  const { data: rows } = await admin
    .from('otp_codes')
    .select('id, code_hash, expires_at, consumed_at, attempts, nombre')
    .eq('email', email)
    .is('consumed_at', null)
    .order('creado_at', { ascending: false })
    .limit(1);

  const row = rows?.[0];
  if (!row) return { error: 'No hay código activo para ese correo. Pedí uno nuevo.' };

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { error: 'El código expiró. Pedí uno nuevo.' };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    await admin.from('otp_codes').update({ consumed_at: new Date().toISOString() }).eq('id', row.id);
    return { error: 'Demasiados intentos. Pedí un código nuevo.' };
  }
  if (row.code_hash !== code_hash) {
    await admin.from('otp_codes').update({ attempts: row.attempts + 1 }).eq('id', row.id);
    return { error: 'Código incorrecto.' };
  }

  // Marca consumido
  await admin.from('otp_codes').update({ consumed_at: new Date().toISOString() }).eq('id', row.id);

  // Crear user en Supabase Auth con email_confirm=true (saltamos su flow de email).
  // Si ya existe (alguien ya pasó el OTP antes), simplemente intentamos login.
  const nombre = row.nombre;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre }
  });
  // Si falla porque ya existe, intentamos resetear password e igual hacer login.
  if (createErr && !/already registered|already exists/i.test(createErr.message)) {
    return { error: createErr.message };
  }
  if (createErr) {
    // Update password del user existente para que el login que sigue funcione
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = list?.users.find((u: { id: string; email?: string }) => u.email?.toLowerCase() === email);
    if (found) {
      await admin.auth.admin.updateUserById(found.id, { password, email_confirm: true });
    }
  }

  // Login con el password recién seteado, para crear la sesión.
  const supabase = await createSupabaseServer();
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signInErr) return { error: signInErr.message };

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

/**
 * Reenvía un nuevo código OTP custom.
 */
export async function resendEmailOtp(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email) return { error: 'Falta el correo.' };

  const admin = createSupabaseAdmin();
  const { data: last } = await admin
    .from('otp_codes')
    .select('id, nombre, consumed_at')
    .eq('email', email)
    .order('creado_at', { ascending: false })
    .limit(1);
  const nombre = last?.[0]?.nombre ?? 'amigo';

  // Marca el código previo como consumido para que no haya dos vigentes simultáneos
  if (last?.[0]?.id && !last?.[0]?.consumed_at) {
    await admin.from('otp_codes').update({ consumed_at: new Date().toISOString() }).eq('id', last[0].id);
  }

  const code = generateOtp();
  const code_hash = hashOtp(code);
  const expires_at = otpExpiresAt().toISOString();

  const { error: insertErr } = await admin
    .from('otp_codes')
    .insert({ email, nombre, code_hash, expires_at });
  if (insertErr) {
    if (/Rate limit/i.test(insertErr.message)) {
      return { error: 'Demasiados códigos en 24 h. Esperá un rato.' };
    }
    return { error: insertErr.message };
  }

  const sent = await sendEmail(
    email,
    'trackdon · código de verificación',
    otpEmailHtml(code, nombre),
    otpEmailText(code, nombre)
  );
  if (!sent.ok) return { error: `No pude enviar: ${sent.error ?? 'desconocido'}` };

  return { resent: true };
}

export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
