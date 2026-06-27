'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase/server';
import { sendEmail, otpEmailHtml, otpEmailText } from '@/lib/email';
import { generateOtp, hashOtp, otpExpiresAt, MAX_ATTEMPTS } from '@/lib/otp';
import { encrypt, decrypt } from '@/lib/crypto';
import { checkUsernamePolicy, policyMessage } from '@/lib/username-policy';

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
 * Solicita un código OTP custom. Pide nombre + email + password en /registro.
 * El password se guarda encriptado (AES-256-GCM) en otp_codes hasta que el
 * código se consume; ahí se crea el user en auth.users con ese password.
 */
export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  console.log('[signUp] start');
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const username = String(formData.get('username') ?? '').trim().toLowerCase();
  const nombre = String(formData.get('nombre') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const password_confirm = String(formData.get('password_confirm') ?? '');
  console.log('[signUp] parsed', { email, username, nombreLen: nombre.length });

  if (!email || !nombre || !password || !username) {
    return { error: 'Todos los campos son obligatorios.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Correo inválido.' };
  }
  const policy = checkUsernamePolicy(username);
  if (!policy.ok) {
    console.warn('[signUp] username blocked', { email, username, reason: policy.reason });
    return { error: policyMessage(policy.reason) };
  }
  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' };
  }
  if (password !== password_confirm) {
    return { error: 'Las contraseñas no coinciden.' };
  }

  const admin = createSupabaseAdmin();

  // Verificar username disponible
  const { data: taken } = await admin
    .from('perfiles')
    .select('id')
    .ilike('username', username)
    .maybeSingle();
  if (taken) {
    return { error: 'Ese nombre de usuario ya está en uso.' };
  }

  const code = generateOtp();
  const code_hash = hashOtp(code);
  const password_enc = encrypt(password);
  const expires_at = otpExpiresAt().toISOString();

  const { error: insertErr } = await admin
    .from('otp_codes')
    .insert({ email, nombre, username, code_hash, password_enc, expires_at });
  if (insertErr) {
    if (/Rate limit/i.test(insertErr.message)) {
      return { error: 'Demasiados códigos en las últimas 24 h. Esperá un rato.' };
    }
    console.error('[signUp] otp insert:', insertErr.message);
    return { error: 'No pude generar el código. Intenta de nuevo.' };
  }

  console.log('[signUp] llamando sendEmail');
  const sent = await sendEmail(
    email,
    'trackdon · código de verificación',
    otpEmailHtml(code, nombre),
    otpEmailText(code, nombre)
  );
  console.log('[signUp] sendEmail result:', JSON.stringify(sent));
  if (!sent.ok) {
    console.error('[signUp] email send failed:', sent.error);
    // Temporal: exponer el error real para diagnosticar
    return { error: `Error al enviar correo: ${sent.error ?? 'desconocido'}` };
  }

  revalidatePath('/', 'layout');
  redirect(`/registro/verificar?email=${encodeURIComponent(email)}`);
}

export type OtpState = { error?: string; resent?: boolean } | null;

/**
 * Verifica el código pegado. El password ya estaba guardado en otp_codes
 * desde el /registro, así que solo pedimos el código.
 */
export async function verifyEmailOtp(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const token = String(formData.get('code') ?? '').replace(/\s+/g, '');

  if (!email || token.length < 6) {
    return { error: 'Pega el código de 6 dígitos que recibiste por correo.' };
  }

  const admin = createSupabaseAdmin();
  const code_hash = hashOtp(token);

  const { data: rows } = await admin
    .from('otp_codes')
    .select('id, code_hash, expires_at, consumed_at, attempts, nombre, username, password_enc')
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
  if (!row.password_enc) {
    return { error: 'Sesión inválida. Por favor regístrate de nuevo.' };
  }

  // Decrypt password and create user
  let password: string;
  try {
    password = decrypt(row.password_enc);
  } catch {
    return { error: 'No pude desencriptar las credenciales. Pedí un código nuevo.' };
  }

  await admin.from('otp_codes').update({ consumed_at: new Date().toISOString() }).eq('id', row.id);

  const nombre = row.nombre;
  const username = row.username;
  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, username }
  });
  if (createErr && !/already registered|already exists/i.test(createErr.message)) {
    return { error: createErr.message };
  }
  if (createErr) {
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = list?.users.find((u: { id: string; email?: string }) => u.email?.toLowerCase() === email);
    if (found) {
      await admin.auth.admin.updateUserById(found.id, { password, email_confirm: true });
    }
  }

  const supabase = await createSupabaseServer();
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signInErr) return { error: signInErr.message };

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

/**
 * Reenvía un nuevo código. Reutiliza el password encriptado del último
 * OTP del mismo email (así el usuario no tiene que volver a tipearlo).
 */
export async function resendEmailOtp(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email) return { error: 'Falta el correo.' };

  const admin = createSupabaseAdmin();
  const { data: last } = await admin
    .from('otp_codes')
    .select('id, nombre, password_enc, consumed_at')
    .eq('email', email)
    .order('creado_at', { ascending: false })
    .limit(1);
  const prev = last?.[0];
  if (!prev) return { error: 'No hay registro previo. Iniciá desde /registro.' };

  const nombre = prev.nombre;
  const password_enc = prev.password_enc;

  if (prev.id && !prev.consumed_at) {
    await admin.from('otp_codes').update({ consumed_at: new Date().toISOString() }).eq('id', prev.id);
  }

  const code = generateOtp();
  const code_hash = hashOtp(code);
  const expires_at = otpExpiresAt().toISOString();

  const { error: insertErr } = await admin
    .from('otp_codes')
    .insert({ email, nombre, code_hash, password_enc, expires_at });
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
  if (!sent.ok) {
    console.error('[resendEmailOtp] email send failed:', sent.error);
    return { error: 'No pude enviar el correo. Intenta de nuevo en un minuto.' };
  }

  return { resent: true };
}

export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
