'use client';

import { useActionState } from 'react';
import { saveSmtpConfig, testSmtp, type SmtpState } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface Initial {
  host?: string;
  port?: number;
  username?: string;
  from_email?: string;
  from_name?: string;
  secure?: boolean;
  enabled?: boolean;
}

export function SmtpForm({ initial }: { initial: Initial | null }) {
  const [saveState, saveAction, saving] = useActionState<SmtpState, FormData>(saveSmtpConfig, null);
  const [testState, testAction, testing] = useActionState<SmtpState, FormData>(testSmtp, null);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <form action={saveAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="host">Host SMTP</Label>
              <Input id="host" name="host" defaultValue={initial?.host ?? ''} placeholder="smtp.gmail.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Puerto</Label>
              <Input id="port" name="port" type="number" defaultValue={initial?.port ?? 587} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input id="username" name="username" defaultValue={initial?.username ?? ''} placeholder="usuario@gmail.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" placeholder={initial ? '(dejar vacío para conservar)' : 'app password'} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from_email">From email</Label>
              <Input id="from_email" name="from_email" type="email" defaultValue={initial?.from_email ?? ''} placeholder="noreply@trackdonations.xyz" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from_name">From nombre</Label>
              <Input id="from_name" name="from_name" defaultValue={initial?.from_name ?? 'trackdon'} />
            </div>
            <Switch
              name="secure"
              defaultChecked={initial?.secure ?? true}
              label="TLS/SSL"
              hint="Cifrar la conexión con el server"
            />
            <Switch
              name="enabled"
              defaultChecked={initial?.enabled ?? false}
              label="Activado"
              hint="Usar este SMTP para enviar correos"
            />
            <div className="md:col-span-2 flex items-center gap-3">
              <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
              {saveState?.error && <p className="text-sm text-destructive">{saveState.error}</p>}
              {saveState?.ok && <p className="text-sm text-primary">Guardado.</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-3 text-base font-semibold">Prueba de envío</h2>
          <form action={testAction} className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="to">Enviar a</Label>
              <Input id="to" name="to" type="email" placeholder="prueba@correo.com" required />
            </div>
            <Button type="submit" variant="outline" disabled={testing}>{testing ? 'Enviando…' : 'Enviar test'}</Button>
          </form>
          {testState?.error && <p className="mt-3 text-sm text-destructive">{testState.error}</p>}
          {testState?.ok && <p className="mt-3 text-sm text-primary">Email enviado. Revisa la bandeja.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
