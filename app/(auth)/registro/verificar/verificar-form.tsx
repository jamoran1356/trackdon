'use client';
import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { verifyEmailOtp, resendEmailOtp, type OtpState } from '../../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function VerificarForm({ email }: { email: string }) {
  const t = useTranslations('auth');
  const [verifyState, verifyAction, verifying] = useActionState<OtpState, FormData>(verifyEmailOtp, null);
  const [resendState, resendAction, resending] = useActionState<OtpState, FormData>(resendEmailOtp, null);

  return (
    <div className="space-y-4">
      <form action={verifyAction} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        <div className="space-y-2">
          <Label htmlFor="code">{t('verify_label')}</Label>
          <Input
            id="code" name="code"
            inputMode="numeric" autoComplete="one-time-code"
            pattern="\d{6}" maxLength={6} required
            placeholder="••••••"
            className="text-center text-lg tracking-[0.5em] font-mono"
          />
        </div>
        {verifyState?.error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{verifyState.error}</p>
        )}
        <Button type="submit" className="w-full" disabled={verifying}>
          {verifying ? t('verify_pending') : t('verify_submit')}
        </Button>
      </form>

      <form action={resendAction} className="border-t border-border/60 pt-4">
        <input type="hidden" name="email" value={email} />
        <Button type="submit" variant="outline" className="w-full" disabled={resending}>
          {resending ? t('verify_resending') : t('verify_resend')}
        </Button>
        {resendState?.error && <p className="mt-2 text-xs text-destructive">{resendState.error}</p>}
        {resendState?.resent && <p className="mt-2 text-xs text-primary">{t('verify_resent')}</p>}
      </form>
    </div>
  );
}
