'use client';
import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { signUp, type AuthState } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SignupForm() {
  const t = useTranslations('auth');
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, null);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre">{t('name')}</Label>
        <Input id="nombre" name="nombre" required minLength={2} placeholder="María R." />
        <p className="text-xs text-muted-foreground">Tu nombre real (visible solo en tu cuenta).</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Nombre de usuario</Label>
        <Input id="username" name="username" required minLength={3} maxLength={20} pattern="[a-z0-9_-]{3,20}" placeholder="maria_r" autoComplete="username" />
        <p className="text-xs text-muted-foreground">Es lo que se ve en el explorador. 3-20 caracteres: a-z, 0-9, _ , -</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder="tu@correo.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t('password')}</Label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" minLength={8} />
        <p className="text-xs text-muted-foreground">{t('min_password')}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password_confirm">{t('password_confirm')}</Label>
        <Input id="password_confirm" name="password_confirm" type="password" required autoComplete="new-password" minLength={8} />
      </div>
      <p className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">{t('otp_note')}</p>
      {state?.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t('submit_signup_pending') : t('submit_signup')}
      </Button>
    </form>
  );
}
