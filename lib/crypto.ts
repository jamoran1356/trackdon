import crypto from 'node:crypto';

/**
 * AES-256-GCM symmetric encryption for short-lived secrets (e.g. passwords
 * sitting in otp_codes for up to 10 minutes until the OTP is consumed).
 *
 * Requires OTP_ENC_KEY in env (32-byte base64).
 */

const ALGO = 'aes-256-gcm';

function key(): Buffer {
  const b64 = process.env.OTP_ENC_KEY;
  if (!b64) throw new Error('OTP_ENC_KEY no configurada');
  const buf = Buffer.from(b64, 'base64');
  if (buf.length !== 32) throw new Error('OTP_ENC_KEY debe ser 32 bytes base64');
  return buf;
}

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key(), iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString('base64');
}

export function decrypt(packed: string): string {
  const buf = Buffer.from(packed, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, key(), iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString('utf8');
}
