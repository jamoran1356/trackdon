/**
 * Envío de emails vía Resend HTTP API (no SMTP).
 *
 * Requiere RESEND_API_KEY en env. Dominio `trackdonations.xyz` verificado
 * en Resend.
 */

const FROM = process.env.RESEND_FROM ?? 'trackdon <noreply@trackdonations.xyz>';
const RESEND_API = 'https://api.resend.com/emails';

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
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: 'RESEND_API_KEY no configurada' };

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM,
        to,
        subject,
        html,
        text
      })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: body?.message ?? `HTTP ${res.status}` };
    }
    return { ok: true, id: body?.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
