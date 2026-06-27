'use client';

import { useActionState } from 'react';
import { asignar, desasignar, type Result } from './actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash2, Link as LinkIcon } from 'lucide-react';

interface Persona { id: string; nombre: string }
interface Vehiculo { id: string; identificador: string }
interface Asignacion { id: string; persona: string; vehiculo: string }

export function AsignarForm({ personas, vehiculos }: { personas: Persona[]; vehiculos: Vehiculo[] }) {
  const [state, action, busy] = useActionState<Result, FormData>(asignar, null);
  return (
    <form action={action} className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="personal_id">Persona</Label>
        <select id="personal_id" name="personal_id" required
          className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" defaultValue="">
          <option value="" disabled>— Elige —</option>
          {personas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="vehiculo_id">Vehículo</Label>
        <select id="vehiculo_id" name="vehiculo_id" required
          className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" defaultValue="">
          <option value="" disabled>— Elige —</option>
          {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.identificador}</option>)}
        </select>
      </div>
      <div className="space-y-2 flex flex-col justify-end">
        <Button type="submit" disabled={busy}>
          <LinkIcon className="h-4 w-4" /> {busy ? 'Asignando…' : 'Asignar'}
        </Button>
      </div>
      <div className="md:col-span-3">
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state?.ok && <p className="text-sm text-primary">Asignación creada.</p>}
      </div>
    </form>
  );
}

export function AsignacionRow({ asignacion }: { asignacion: Asignacion }) {
  const [, action] = useActionState<Result, FormData>(desasignar, null);
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex-1">
          <p className="text-sm font-medium">{asignacion.persona}</p>
          <p className="text-xs text-muted-foreground">vehículo: {asignacion.vehiculo}</p>
        </div>
        <form action={action}>
          <input type="hidden" name="id" value={asignacion.id} />
          <Button type="submit" variant="ghost" size="icon" aria-label="Desasignar">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
