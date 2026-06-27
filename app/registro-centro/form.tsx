'use client';

import { useActionState } from 'react';
import { registerCentro, type CentroState } from './actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Evento { id: string; nombre: string; slug: string }

export function RegistroCentroForm({ eventos }: { eventos: Evento[] }) {
  const [state, action, busy] = useActionState<CentroState, FormData>(registerCentro, null);

  return (
    <Card>
      <CardContent className="p-6">
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del centro / organización</Label>
            <Input id="nombre" name="nombre" required minLength={3}
              placeholder="Ej: Centro de Acopio Caracas Este" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <select id="tipo" name="tipo" defaultValue="centro_acopio"
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="centro_acopio">Centro de acopio</option>
              <option value="fundacion">Fundación</option>
              <option value="iglesia">Iglesia / parroquia</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input id="direccion" name="direccion"
              placeholder="Av. principal, calle, número, referencia" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_contacto">Correo de contacto público</Label>
            <Input id="email_contacto" name="email_contacto" type="email"
              placeholder="contacto@tuorganizacion.com" />
            <p className="text-xs text-muted-foreground">Lo verán los donantes en tu perfil. Opcional.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evento_id">Evento al que respondés (opcional)</Label>
            <select id="evento_id" name="evento_id" defaultValue=""
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="">— Sin evento específico —</option>
              {eventos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>

          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-muted-foreground">
            Al registrarte declaras que eres representante autorizado de la organización. Un validador podrá
            pedirte documentación para auditar la operación. Si el centro resulta no existir o no estar autorizado,
            puede ser desactivado.
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Registrando…' : 'Registrar centro'}
          </Button>
          {state?.error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
