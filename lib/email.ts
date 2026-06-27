/**
 * Envío de emails. Prefiere SMTP configurado en admin (smtp_config) si está
 * "enabled"; cae a Resend HTTP API si no.
 */

import nodemailer from 'nodemailer';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { decrypt } from '@/lib/crypto';

export interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<SendResult> {
  console.log('[email] sendEmail start', { to, subject });

  // 1) Intentar SMTP de admin
  const smtp = await loadSmtp();
  console.log('[email] loadSmtp result:', smtp ? `host=${smtp.host} port=${smtp.port} from=${smtp.from_email}` : 'null');
  if (smtp) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: { user: smtp.username, pass: smtp.password },
        connectionTimeout: 15_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000
      });
      const info = await transporter.sendMail({
        from: `${smtp.from_name} <${smtp.from_email}>`,
        to,
        subject,
        html,
        text
      });
      console.log('[email] smtp sent', info.messageId);
      return { ok: true, id: info.messageId };
    } catch (e) {
      console.error('[email.smtp] FALLO completo:', {
        name: (e as Error).name,
        message: (e as Error).message,
        stack: (e as Error).stack?.split('\n').slice(0, 5).join(' | ')
      });
      // fallthrough a Resend
    }
  }

  // 2) Fallback Resend HTTP
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: 'No hay proveedor de email configurado' };

  const FROM = process.env.RESEND_FROM ?? 'trackdon <noreply@trackdonations.xyz>';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to, subject, html, text })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: body?.message ?? `HTTP ${res.status}` };
    return { ok: true, id: body?.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

async function loadSmtp() {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from('smtp_config')
      .select('host, port, username, password, from_email, from_name, secure, enabled')
      .eq('id', 1)
      .maybeSingle();
    if (!data || !data.enabled) return null;
    return {
      host: data.host,
      port: data.port,
      secure: data.secure,
      username: data.username,
      password: decrypt(data.password),
      from_email: data.from_email,
      from_name: data.from_name
    };
  } catch (e) {
    console.error('[email.loadSmtp]', (e as Error).message);
    return null;
  }
}

export function otpEmailHtml(code: string, nombre: string): string {
  return `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#202124;">
  <h2 style="color:#16a34a;margin:0 0 12px;">Hola ${escapeHtml(nombre)},</h2>
  <p style="margin:0 0 16px;line-height:1.5;">Tu código de verificación para trackdon:</p>
  <div style="font-family:monospace;font-size:36px;font-weight:bold;letter-spacing:0.45em;text-align:center;background:#f1f5f3;border:2px solid #16a34a;border-radius:12px;padding:18px;margin:24px 0;">${code}</div>
  <p style="font-size:13px;color:#5f6368;margin:0 0 12px;line-height:1.4;">
    Expira en 10 minutos. Si no fuiste tú, ignora este correo.
  </p>
  <hr style="border:none;border-top:1px solid #e8eaed;margin:24px 0;">
  <p style="font-size:12px;color:#80868b;margin:0;">
    trackdon — open source, sin fines de lucro.
    <a href="https://trackdonations.xyz" style="color:#80868b;">trackdonations.xyz</a>
  </p>
</div>`.trim();
}

export function otpEmailText(code: string, nombre: string): string {
  return `Hola ${nombre},\n\nTu código de verificación para trackdon: ${code}\n\nExpira en 10 minutos. Si no fuiste tú, ignora este correo.\n\ntrackdon — trackdonations.xyz`;
}

export interface InvitationEmailData {
  email: string;
  remitenteUsername: string;
  eventoNombre?: string;
  mensajePersonal?: string;
  acceptUrl: string;
}

export function invitationEmailHtml(d: InvitationEmailData): string {
  const eventoLine = d.eventoNombre
    ? `<p style="margin:0 0 16px;line-height:1.6;">Te están invitando para que registres en qué se invirtieron las donaciones recibidas por el evento <strong>${escapeHtml(d.eventoNombre)}</strong>.</p>`
    : '';
  const mensajeBlock = d.mensajePersonal
    ? `<div style="margin:24px 0;padding:14px 16px;border-left:3px solid #16a34a;background:#f1f5f3;border-radius:4px;">
         <p style="margin:0 0 6px;font-size:12px;color:#5f6368;text-transform:uppercase;letter-spacing:0.05em;">Mensaje de @${escapeHtml(d.remitenteUsername)}</p>
         <p style="margin:0;font-size:14px;color:#202124;white-space:pre-wrap;">${escapeHtml(d.mensajePersonal)}</p>
       </div>`
    : '';

  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#202124;background:#ffffff;">
  <div style="display:inline-block;padding:6px 12px;background:#16a34a;color:#ffffff;font-weight:700;font-size:13px;border-radius:999px;letter-spacing:0.05em;">trackdon</div>

  <h1 style="margin:24px 0 12px;font-size:24px;color:#202124;line-height:1.3;">@${escapeHtml(d.remitenteUsername)} te donó algo y necesita que rindas en qué se invirtió.</h1>
  ${eventoLine}

  <p style="margin:0 0 16px;line-height:1.6;color:#4b5563;">
    <strong>trackdon</strong> es el libro público de donaciones humanitarias. Permite que cualquier persona vea
    quién donó, qué centro o organización recibió, y cómo terminó usándose. Cero custodia de fondos — eres tú
    quien sigue manejando lo recibido. Lo que pedimos es que registres aquí la rendición de gastos, con sus
    comprobantes, para cerrar el rastro.
  </p>

  ${mensajeBlock}

  <div style="margin:32px 0;text-align:center;">
    <a href="${d.acceptUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:8px;">
      Registrarme y reclamar las donaciones
    </a>
  </div>

  <p style="font-size:13px;color:#5f6368;line-height:1.5;margin:0 0 8px;">
    <strong>¿Por qué hacer esto?</strong> Porque los donantes están eligiendo apoyar a organizaciones que muestran
    la traza completa. Estar en trackdon es una señal pública de transparencia.
  </p>

  <p style="font-size:13px;color:#5f6368;line-height:1.5;margin:0 0 24px;">
    El link expira en 30 días. Si no eras la organización destinataria de esta donación, puedes ignorar este correo.
  </p>

  <hr style="border:none;border-top:1px solid #e8eaed;margin:24px 0;">
  <p style="font-size:11px;color:#80868b;margin:0;">
    Open source · sin fines de lucro · <a href="https://trackdonations.xyz" style="color:#80868b;">trackdonations.xyz</a>
  </p>
</div>`.trim();
}

export function invitationEmailText(d: InvitationEmailData): string {
  const evento = d.eventoNombre ? `\n\nEvento: ${d.eventoNombre}` : '';
  const msg = d.mensajePersonal ? `\n\nMensaje de @${d.remitenteUsername}:\n${d.mensajePersonal}` : '';
  return `@${d.remitenteUsername} te donó algo y necesita que rindas en qué se invirtió.${evento}

trackdon es el libro público de donaciones humanitarias. Permite que cualquier persona vea quién donó, qué organización recibió, y cómo terminó usándose. Cero custodia de fondos — eres tú quien sigue manejando lo recibido. Pedimos que registres aquí la rendición de gastos para cerrar el rastro.${msg}

Registrate y reclamá las donaciones:
${d.acceptUrl}

El link expira en 30 días. Si no eras la organización destinataria, puedes ignorar este correo.

trackdon — trackdonations.xyz`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
