'use client';
import { useActionState } from 'react';
import { signUp, type AuthState } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, null);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre">Tu nombre (cómo aparecerás públicamente)</Label>
        <Input id="nombre" name="nombre" required minLength={2} placeholder="María R." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder="tu@correo.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" minLength={8} />
        <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
      </div>
      {state?.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Creando cuenta…' : 'Crear cuenta'}
      </Button>
    </form>
  );
}
