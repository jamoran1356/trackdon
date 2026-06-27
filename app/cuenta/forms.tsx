'use client';

import { useActionState } from 'react';
import {
  changeMyPassword, changeMyEmail, changeMyName, changeMyUsername, changeMyNombreReal
} from './actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface CuentaFormsProps {
  email: string;
  nombre: string;
  username: string;
  nombreReal: string;
  kycVerifiedAt: string | null;
}

export function CuentaForms({ email, nombre, username, nombreReal, kycVerifiedAt }: CuentaFormsProps) {
  const [nameState, nameAction, nameBusy] = useActionState(changeMyName, null);
  const [userState, userAction, userBusy] = useActionState(changeMyUsername, null);
  const [realState, realAction, realBusy] = useActionState(changeMyNombreReal, null);
  const [pwState, pwAction, pwBusy] = useActionState(changeMyPassword, null);
  const [emailState, emailAction, emailBusy] = useActionState(changeMyEmail, null);

  return (
    <div className="space-y-6">
      {/* USERNAME (público) */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Nombre de usuario</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Público. Se ve en el explorador y en URLs. Único.
              </p>
            </div>
            <Badge variant="outline" className="font-mono">@{username}</Badge>
          </div>
          <form action={userAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="username">Nuevo username</Label>
              <Input
                id="username" name="username" defaultValue={username}
                minLength={3} maxLength={20} pattern="[a-z0-9_-]{3,20}"
                placeholder="ej. maria_r"
              />
              <p className="text-xs text-muted-foreground">3-20 chars: a-z, 0-9, guion, guion bajo.</p>
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <Button type="submit" disabled={userBusy}>{userBusy ? 'Guardando…' : 'Cambiar username'}</Button>
              {userState?.error && <p className="text-sm text-destructive">{userState.error}</p>}
              {userState?.ok && <p className="text-sm text-primary">Username actualizado.</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* NOMBRE REAL (privado / KYC) */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Nombre real</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Privado. Solo lo ve el equipo de validación. Opcional, salvo que pidas KYC.
              </p>
            </div>
            {kycVerifiedAt && <Badge variant="default">KYC verificado</Badge>}
          </div>
          <form action={realAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nombre_real">Nombre legal completo</Label>
              <Input
                id="nombre_real" name="nombre_real" defaultValue={nombreReal}
                placeholder="María Rodríguez Pérez"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <Button type="submit" disabled={realBusy}>{realBusy ? 'Guardando…' : 'Guardar'}</Button>
              {realState?.error && <p className="text-sm text-destructive">{realState.error}</p>}
              {realState?.ok && <p className="text-sm text-primary">Nombre real actualizado.</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* NOMBRE MOSTRADO (display) */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-1 text-base font-semibold">Nombre para mostrar</h2>
          <p className="mb-4 text-xs text-muted-foreground">Etiqueta amistosa en tu propio panel.</p>
          <form action={nameAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" defaultValue={nombre} minLength={2} required />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <Button type="submit" disabled={nameBusy}>{nameBusy ? 'Guardando…' : 'Guardar'}</Button>
              {nameState?.error && <p className="text-sm text-destructive">{nameState.error}</p>}
              {nameState?.ok && <p className="text-sm text-primary">Nombre actualizado.</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* PASSWORD */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-1 text-base font-semibold">Cambiar contraseña</h2>
          <p className="mb-4 text-xs text-muted-foreground">Requiere tu contraseña actual.</p>
          <form action={pwAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="current_password">Contraseña actual</Label>
              <Input id="current_password" name="current_password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">Nueva (≥8)</Label>
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

      {/* EMAIL */}
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
