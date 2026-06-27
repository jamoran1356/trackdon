'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { sendEmail, otpEmailHtml, otpEmailText } from '@/lib/email';
import { generateOtp, hashOtp, otpExpiresAt } from '@/lib/otp';
import { encrypt } from '@/lib/crypto';
import { checkUsernamePolicy, policyMessage } from '@/lib/username-policy';

export type CentroState = { error?: string } | null;

const TIPOS = ['centro_acopio', 'fundacion', 'iglesia', 'otro'];

interface CentroData {
  nombre: string;
  tipo: string;
  direccion: string | null;
  email_contacto: string | null;
  evento_id: string | null;
}

function parseCentroData(formData: FormData): CentroData | { error: string } {
  const nombre = String(formData.get('centro_nombre') ?? '').trim();
  const tipo = String(formData.get('centro_tipo') ?? 'centro_acopio');
  const direccion = String(formData.get('centro_direccion') ?? '').trim() || null;
  const email_contacto = String(formData.get('centro_email_contacto') ?? '').trim().toLowerCase() || null;
  const evento_id = String(formData.get('centro_evento_id') ?? '').trim() || null;

  if (nombre.length < 3) return { error: 'Nombre del centro muy corto.' };
  if (!TIPOS.includes(tipo)) return { error: 'Tipo de centro inválido.' };
  if (email_contacto && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_contacto)) {
    return { error: 'Correo de contacto inválido.' };
  }
  return { nombre, tipo, direccion, email_contacto, evento_id };
}

async function createCentroForUser(userId: string, centro: CentroData): Promise<{ error?: string }> {
  const admin = createSupabaseAdmin();

  // Bloquea duplicados
  const { data: existing } = await admin
    .from('responsables').select('centro_id')
    .eq('usuario_auth_id', userId).limit(1).maybeSingle();
  if (existing) return { error: 'Ya estás vinculado como responsable de un centro.' };

  const { data: c, error: cErr } = await admin
    .from('centros_acopio')
    .insert({
      nombre: centro.nombre, tipo: centro.tipo,
      direccion: centro.direccion, email_contacto: centro.email_contacto,
      evento_id: centro.evento_id, activo: true,
      responsable_principal_id: null
    })
    .select('id').single();
  if (cErr || !c) return { error: cErr?.message ?? 'No pude crear el centro.' };

  const { data: r, error: rErr } = await admin
    .from('responsables')
    .insert({ centro_id: c.id, usuario_auth_id: userId, nombre: '', rol: 'admin' })
    .select('id').single();
  if (rErr) return { error: 'Centro creado pero no se pudo vincular el responsable.' };

  await admin.from('centros_acopio').update({ responsable_principal_id: r.id }).eq('id', c.id);
  await admin.from('perfiles').update({ rol: 'centro_admin' }).eq('id', userId);

  return {};
}

/**
 * Wizard unificado: crea cuenta de admin + centro en un solo flow.
 * - Si el usuario ya está logueado: solo crea el centro y lo asocia.
 * - Si no: inserta OTP con tipo_signup='centro' + extra_data, manda email,
 *   y al verificar se crean ambos (user + centro).
 */
export async function registerCentro(_prev: CentroState, formData: FormData): Promise<CentroState> {
  const centroParsed = parseCentroData(formData);
  if ('error' in centroParsed) return { error: centroParsed.error };
  const centro = centroParsed;

  // Caso A: usuario ya autenticado → crea centro directo
  const user = await getSessionUser();
  if (user) {
    const result = await createCentroForUser(user.id, centro);
    if (result.error) return { error: result.error };
    revalidatePath('/', 'layout');
    redirect('/dashboard/centro');
  }

  // Caso B: signup combinado (user + centro vía OTP)
  const email = String(formData.get('admin_email') ?? '').trim().toLowerCase();
  const username = String(formData.get('admin_username') ?? '').trim().toLowerCase();
  const nombre = String(formData.get('admin_nombre') ?? '').trim();
  const password = String(formData.get('admin_password') ?? '');
  const password_confirm = String(formData.get('admin_password_confirm') ?? '');

  if (!email || !username || !nombre || !password) {
    return { error: 'Completa los datos del responsable del centro.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Correo del admin inválido.' };
  const policy = checkUsernamePolicy(username);
  if (!policy.ok) return { error: policyMessage(policy.reason) };
  if (password.length < 8) return { error: 'Contraseña: mínimo 8 caracteres.' };
  if (password !== password_confirm) return { error: 'Las contraseñas no coinciden.' };

  const admin = createSupabaseAdmin();
  const { data: taken } = await admin
    .from('perfiles').select('id').ilike('username', username).maybeSingle();
  if (taken) return { error: 'Ese nombre de usuario ya está en uso.' };

  const code = generateOtp();
  const code_hash = hashOtp(code);
  const password_enc = encrypt(password);
  const expires_at = otpExpiresAt().toISOString();

  const { error: insertErr } = await admin
    .from('otp_codes')
    .insert({
      email, nombre, username, code_hash, password_enc, expires_at,
      tipo_signup: 'centro',
      extra_data: centro
    });
  if (insertErr) {
    if (/Rate limit/i.test(insertErr.message)) {
      return { error: 'Demasiados códigos en 24 h. Espera un rato.' };
    }
    return { error: 'No pude generar el código de verificación.' };
  }

  const sent = await sendEmail(
    email,
    'trackdon · verifica tu cuenta de centro',
    otpEmailHtml(code, nombre),
    otpEmailText(code, nombre)
  );
  if (!sent.ok) return { error: `Error al enviar correo: ${sent.error ?? 'desconocido'}` };

  redirect(`/registro/verificar?email=${encodeURIComponent(email)}`);
}
