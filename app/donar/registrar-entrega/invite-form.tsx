'use client';

import { useActionState } from 'react';
import { inviteOrganizacion, type InviteState } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle2 } from 'lucide-react';

export function InviteOrganizacionForm({ eventoId }: { eventoId: string | null }) {
  const [state, action, busy] = useActionState<InviteState, FormData>(inviteOrganizacion, null);

  if (state?.ok) {
    return (
      <div className="rounded-md border border-primary/40 bg-primary/5 px-4 py-3">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Invitación enviada.</p>
            <p className="mt-1 text-muted-foreground">
              Le llegó un correo explicando el proyecto. Cuando se registre, podrá reclamar las donaciones que le hagas y publicar la rendición.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-4">
      <div>
        <p className="text-sm font-medium">¿Querés invitar a esta organización a trackdon?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Le mandamos un correo explicando el proyecto y un link único para que se registre. Después puedes volver aquí y registrar la transferencia.
        </p>
      </div>
      {eventoId && <input type="hidden" name="evento_id" value={eventoId} />}
      <div className="space-y-2">
        <Label htmlFor="invite_email">Correo de la organización</Label>
        <Input id="invite_email" name="email" type="email" required placeholder="contacto@organizacion.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite_mensaje">Mensaje (opcional)</Label>
        <textarea
          id="invite_mensaje"
          name="mensaje"
          maxLength={500}
          rows={3}
          placeholder="Ej: Hola, les transferí $200 por Zelle ref 8847 — ¿pueden registrarse para cerrar el rastro?"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="text-xs text-muted-foreground">Aparece como cita en el correo.</p>
      </div>
      <Button type="submit" disabled={busy} variant="outline" size="sm">
        <Mail className="h-4 w-4" /> {busy ? 'Enviando…' : 'Enviar invitación'}
      </Button>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
