'use server';

import nodemailer from 'nodemailer';
import { revalidatePath } from 'next/cache';
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase/server';
import { encrypt, decrypt } from '@/lib/crypto';

export type SmtpState = { error?: string; ok?: boolean } | null;

async function requireSuperAdmin() {
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

export async function saveSmtpConfig(_prev: SmtpState, formData: FormData): Promise<SmtpState> {
  let userId: string;
  try {
    userId = await requireSuperAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const host = String(formData.get('host') ?? '').trim();
  const port = parseInt(String(formData.get('port') ?? '587'), 10);
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const from_email = String(formData.get('from_email') ?? '').trim();
  const from_name = String(formData.get('from_name') ?? 'trackdon').trim();
  const secure = formData.get('secure') === 'on';
  const enabled = formData.get('enabled') === 'on';

  if (!host || !port || !username || !from_email) {
    return { error: 'Host, puerto, usuario y from son obligatorios.' };
  }
  if (port < 1 || port > 65535) {
    return { error: 'Puerto inválido.' };
  }

  const admin = createSupabaseAdmin();

  // Si se manda password vacío, conservar el actual (no sobreescribir).
  let password_enc: string | undefined;
  if (password) {
    password_enc = encrypt(password);
  } else {
    const { data: cur } = await admin.from('smtp_config').select('password').eq('id', 1).maybeSingle();
    if (!cur) return { error: 'Contraseña requerida en la primera configuración.' };
    password_enc = cur.password;
  }

  const { error } = await admin
    .from('smtp_config')
    .upsert({
      id: 1, host, port, username, password: password_enc,
      from_email, from_name, secure, enabled,
      updated_at: new Date().toISOString(),
      updated_by: userId
    });

  if (error) {
    console.error('[smtp.save]', error.message);
    return { error: 'No pude guardar la configuración.' };
  }

  revalidatePath('/admin/smtp');
  return { ok: true };
}

export async function testSmtp(_prev: SmtpState, formData: FormData): Promise<SmtpState> {
  try {
    await requireSuperAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const to = String(formData.get('to') ?? '').trim();
  if (!to) return { error: 'Falta destinatario.' };

  const admin = createSupabaseAdmin();
  const { data: cfg } = await admin
    .from('smtp_config')
    .select('host, port, username, password, from_email, from_name, secure')
    .eq('id', 1)
    .maybeSingle();
  if (!cfg) return { error: 'Primero guarda la configuración SMTP.' };

  let password: string;
  try {
    password = decrypt(cfg.password);
  } catch {
    return { error: 'No pude descifrar la password guardada. Vuelve a guardarla.' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.username, pass: password }
    });
    await transporter.verify();
    await transporter.sendMail({
      from: `${cfg.from_name} <${cfg.from_email}>`,
      to,
      subject: 'trackdon · test SMTP',
      html: '<p>Si recibes esto, el SMTP configurado en /admin/smtp está funcionando.</p>',
      text: 'Si recibes esto, el SMTP configurado en /admin/smtp está funcionando.'
    });
    return { ok: true };
  } catch (e) {
    console.error('[smtp.test]', (e as Error).message);
    return { error: (e as Error).message };
  }
}
