'use client';

import { useActionState } from 'react';
import { registerCentro, type CentroState } from './actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Warehouse, UserCircle } from 'lucide-react';

interface Evento { id: string; nombre: string; slug: string }

interface Props {
  userLogged: boolean;
  userEmail: string | null;
  eventos: Evento[];
}

export function RegistroCentroForm({ userLogged, userEmail, eventos }: Props) {
  const [state, action, busy] = useActionState<CentroState, FormData>(registerCentro, null);

  return (
    <form action={action} className="space-y-6">
      {/* --- Card 1: Datos del centro --- */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Sobre el centro</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="centro_nombre">Nombre del centro / organización</Label>
              <Input id="centro_nombre" name="centro_nombre" required minLength={3}
                placeholder="Ej: Centro de Acopio Caracas Este" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="centro_tipo">Tipo</Label>
              <select id="centro_tipo" name="centro_tipo" defaultValue="centro_acopio"
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="centro_acopio">Centro de acopio</option>
                <option value="fundacion">Fundación</option>
                <option value="iglesia">Iglesia / parroquia</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="centro_evento_id">Evento al que respondes (opcional)</Label>
              <select id="centro_evento_id" name="centro_evento_id" defaultValue=""
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="">— Ninguno —</option>
                {eventos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="centro_direccion">Dirección</Label>
              <Input id="centro_direccion" name="centro_direccion"
                placeholder="Av. principal, calle, número, referencia" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="centro_email_contacto">Correo de contacto público</Label>
              <Input id="centro_email_contacto" name="centro_email_contacto" type="email"
                placeholder="contacto@tuorganizacion.com" />
              <p className="text-xs text-muted-foreground">Lo verán los donantes en tu perfil público. Opcional.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Card 2: Datos del responsable (solo si no está logueado) --- */}
      {!userLogged ? (
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold">Tu cuenta de administrador del centro</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin_username">Nombre de usuario</Label>
                <Input id="admin_username" name="admin_username" required minLength={3} maxLength={20}
                  pattern="[a-z0-9_\-]{3,20}" placeholder="maria_r" autoComplete="username" />
                <p className="text-xs text-muted-foreground">Público. 3-20 caracteres: a-z, 0-9, _ , -</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin_nombre">Tu nombre (como aparece en tu identificación)</Label>
                <Input id="admin_nombre" name="admin_nombre" required minLength={2}
                  placeholder="María Rodríguez Pérez" />
                <p className="text-xs text-muted-foreground">Privado. Solo para el equipo de validación si pides KYC.</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="admin_email">Correo de login</Label>
                <Input id="admin_email" name="admin_email" type="email" required autoComplete="email"
                  placeholder="tu@correo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin_password">Contraseña (≥8)</Label>
                <Input id="admin_password" name="admin_password" type="password" minLength={8} required
                  autoComplete="new-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin_password_confirm">Confirmar</Label>
                <Input id="admin_password_confirm" name="admin_password_confirm" type="password"
                  minLength={8} required autoComplete="new-password" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm">
              <UserCircle className="h-4 w-4 text-primary" />
              <span>Vas a quedar como admin del centro con tu cuenta actual: <strong>{userEmail}</strong></span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-muted-foreground">
        Al registrarte declaras que eres representante autorizado de la organización. Un validador podrá pedirte
        documentación para auditar la operación. Si el centro resulta no existir o no estar autorizado, puede ser
        desactivado.
      </div>

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? 'Registrando…' : (userLogged ? 'Registrar centro' : 'Crear cuenta + registrar centro')}
      </Button>
      {state?.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
