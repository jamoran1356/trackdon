'use client';

import { useActionState } from 'react';
import { addPunto, togglePunto, deletePunto, type Result } from './actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, MapPin } from 'lucide-react';

interface Punto {
  id: string; nombre: string; direccion: string | null;
  horario: string | null; capacidad_estimada: string | null; activo: boolean;
}

export function AddPuntoForm({ centroId }: { centroId: string }) {
  const [state, action, busy] = useActionState<Result, FormData>(addPunto, null);
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="centro_id" value={centroId} />
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" name="nombre" required placeholder="Recepción Plaza Norte" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="capacidad_estimada">Capacidad estimada</Label>
        <Input id="capacidad_estimada" name="capacidad_estimada" placeholder="Ej: 50 cajas/día" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="direccion">Dirección</Label>
        <Input id="direccion" name="direccion" placeholder="Av. principal, número, referencia" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="horario">Horario</Label>
        <Input id="horario" name="horario" placeholder="Lun-Vie 9h-17h" />
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={busy}>{busy ? 'Agregando…' : 'Agregar punto'}</Button>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state?.ok && <p className="text-sm text-primary">Punto agregado.</p>}
      </div>
    </form>
  );
}

export function PuntoRow({ punto }: { punto: Punto }) {
  const [, toggleAction] = useActionState<Result, FormData>(togglePunto, null);
  const [, delAction] = useActionState<Result, FormData>(deletePunto, null);
  return (
    <Card className={punto.activo ? '' : 'opacity-60'}>
      <CardContent className="flex items-start gap-3 p-4">
        <MapPin className="mt-1 h-4 w-4 text-primary" />
        <div className="flex-1">
          <p className="font-medium">{punto.nombre}</p>
          {punto.direccion && <p className="text-xs text-muted-foreground">{punto.direccion}</p>}
          <p className="text-xs text-muted-foreground">
            {punto.horario ?? 'sin horario'}{punto.capacidad_estimada ? ` · ${punto.capacidad_estimada}` : ''}
          </p>
        </div>
        <form action={toggleAction}>
          <input type="hidden" name="id" value={punto.id} />
          <Switch
            name="activo"
            defaultChecked={punto.activo}
            onChange={(e) => {
              const form = (e.currentTarget as HTMLInputElement).closest('form') as HTMLFormElement | null;
              form?.requestSubmit();
            }}
          />
        </form>
        <form action={delAction}>
          <input type="hidden" name="id" value={punto.id} />
          <Button type="submit" variant="ghost" size="icon" aria-label="Eliminar">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
