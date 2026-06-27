'use client';

import { useActionState } from 'react';
import { addPersonal, togglePersonal, type Result } from './actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface Persona {
  id: string; nombre: string; cedula: string | null; cargo: string | null; activo: boolean;
}

export function AddPersonalForm({ centroId }: { centroId: string }) {
  const [state, action, busy] = useActionState<Result, FormData>(addPersonal, null);
  return (
    <form action={action} className="grid gap-4 md:grid-cols-3">
      <input type="hidden" name="centro_id" value={centroId} />
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre completo</Label>
        <Input id="nombre" name="nombre" required placeholder="María García" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cedula">Cédula / DNI (privado)</Label>
        <Input id="cedula" name="cedula" placeholder="V-12345678" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cargo">Cargo</Label>
        <Input id="cargo" name="cargo" placeholder="Voluntario, Logística…" />
      </div>
      <div className="md:col-span-3 flex items-center gap-3">
        <Button type="submit" disabled={busy}>{busy ? 'Agregando…' : 'Agregar'}</Button>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state?.ok && <p className="text-sm text-primary">Persona agregada.</p>}
      </div>
    </form>
  );
}

export function PersonalRow({ persona }: { persona: Persona }) {
  const [, action] = useActionState<Result, FormData>(togglePersonal, null);
  return (
    <Card className={persona.activo ? '' : 'opacity-60'}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex-1">
          <p className="font-medium">{persona.nombre}</p>
          <p className="text-xs text-muted-foreground">
            {persona.cargo ?? 'sin cargo'} · {persona.cedula ? <span className="font-mono">{persona.cedula}</span> : 'sin cédula'}
          </p>
        </div>
        {!persona.activo && <Badge variant="secondary">Inactivo</Badge>}
        <form action={action}>
          <input type="hidden" name="id" value={persona.id} />
          <Switch
            name="activo"
            defaultChecked={persona.activo}
            onChange={(e) => {
              const form = (e.currentTarget as HTMLInputElement).closest('form') as HTMLFormElement | null;
              form?.requestSubmit();
            }}
          />
        </form>
      </CardContent>
    </Card>
  );
}
