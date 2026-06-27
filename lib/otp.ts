import crypto from 'node:crypto';

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

/** Generates a cryptographically secure 6-digit code (000000-999999). */
export function generateOtp(): string {
  // Use crypto.randomInt for uniform distribution.
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(OTP_LENGTH, '0');
}

/** sha256 hex digest. */
export function hashOtp(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function otpExpiresAt(): Date {
  return new Date(Date.now() + OTP_TTL_MS);
}

export { MAX_ATTEMPTS, OTP_TTL_MS };
