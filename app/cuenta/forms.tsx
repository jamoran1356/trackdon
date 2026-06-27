'use client';

import { useActionState } from 'react';
import { changeMyPassword, changeMyEmail, changeMyName } from './actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CuentaForms({ email, nombre }: { email: string; nombre: string }) {
  const [nameState, nameAction, nameBusy] = useActionState(changeMyName, null);
  const [pwState, pwAction, pwBusy] = useActionState(changeMyPassword, null);
  const [emailState, emailAction, emailBusy] = useActionState(changeMyEmail, null);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-1 text-base font-semibold">Nombre</h2>
          <p className="mb-4 text-xs text-muted-foreground">Cómo te ven otros usuarios en la plataforma.</p>
          <form action={nameAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" defaultValue={nombre} placeholder="Tu nombre" minLength={2} required />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <Button type="submit" disabled={nameBusy}>{nameBusy ? 'Guardando…' : 'Guardar'}</Button>
              {nameState?.error && <p className="text-sm text-destructive">{nameState.error}</p>}
              {nameState?.ok && <p className="text-sm text-primary">Nombre actualizado.</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-1 text-base font-semibold">Cambiar contraseña</h2>
          <p className="mb-4 text-xs text-muted-foreground">Requiere tu contraseña actual para confirmar.</p>
          <form action={pwAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="current_password">Contraseña actual</Label>
              <Input id="current_password" name="current_password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">Nueva contraseña (≥8)</Label>
              <Input id="new_password" name="new_password" type="password" minLength={8} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirmar</Label>
              <Input id="confirm_password" name="confirm_password" type="password" minLength={8} required />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <Button type="submit" disabled={pwBusy}>{pwBusy ? 'Cambiando…' : 'Cambiar contraseña'}</Button>
              {pwState?.error && <p className="text-sm text-destructive">{pwState.error}</p>}
              {pwState?.ok && <p className="text-sm text-primary">Contraseña actualizada.</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-1 text-base font-semibold">Cambiar email</h2>
          <p className="mb-4 text-xs text-muted-foreground">Email actual: <strong>{email}</strong></p>
          <form action={emailAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new_email">Nuevo email</Label>
              <Input id="new_email" name="new_email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_password_email">Contraseña actual</Label>
              <Input id="current_password_email" name="current_password" type="password" required />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <Button type="submit" disabled={emailBusy}>{emailBusy ? 'Cambiando…' : 'Cambiar email'}</Button>
              {emailState?.error && <p className="text-sm text-destructive">{emailState.error}</p>}
              {emailState?.ok && <p className="text-sm text-primary">Email actualizado.</p>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
