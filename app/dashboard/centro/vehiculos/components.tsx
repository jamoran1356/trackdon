'use client';

import { useActionState } from 'react';
import { addVehiculo, setVehiculoEstado, type Result } from './actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const ESTADOS = ['disponible','cargando','en_ruta','descargando','mantenimiento'];

interface Vehiculo {
  id: string; identificador: string;
  marca: string | null; modelo: string | null; placa: string | null;
  capacidad_kg: number | null; estado: string;
}

export function AddVehiculoForm({ centroId }: { centroId: string }) {
  const [state, action, busy] = useActionState<Result, FormData>(addVehiculo, null);
  return (
    <form action={action} className="grid gap-4 md:grid-cols-3">
      <input type="hidden" name="centro_id" value={centroId} />
      <div className="space-y-2 md:col-span-1">
        <Label htmlFor="identificador">Identificador</Label>
        <Input id="identificador" name="identificador" required placeholder="TX-42, Camión A" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="marca">Marca</Label>
        <Input id="marca" name="marca" placeholder="Toyota" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="modelo">Modelo</Label>
        <Input id="modelo" name="modelo" placeholder="Hilux 2018" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="placa">Placa</Label>
        <Input id="placa" name="placa" placeholder="ABC-123" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="capacidad_kg">Capacidad (kg)</Label>
        <Input id="capacidad_kg" name="capacidad_kg" type="number" step="any" min={0} />
      </div>
      <div className="md:col-span-3 flex items-center gap-3">
        <Button type="submit" disabled={busy}>{busy ? 'Agregando…' : 'Agregar vehículo'}</Button>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state?.ok && <p className="text-sm text-primary">Vehículo agregado.</p>}
      </div>
    </form>
  );
}

export function VehiculoRow({ vehiculo }: { vehiculo: Vehiculo }) {
  const [state, action] = useActionState<Result, FormData>(setVehiculoEstado, null);

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 p-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium">{vehiculo.identificador}</p>
          <p className="text-xs text-muted-foreground">
            {[vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ') || '—'}
            {vehiculo.placa && <span> · placa <span className="font-mono">{vehiculo.placa}</span></span>}
            {vehiculo.capacidad_kg && <span> · {vehiculo.capacidad_kg} kg</span>}
          </p>
          {state?.error && <p className="mt-1 text-xs text-destructive">{state.error}</p>}
        </div>
        <Badge variant={vehiculo.estado === 'disponible' ? 'default' : 'secondary'}>
          {vehiculo.estado}
        </Badge>
        <form action={action} className="flex items-center gap-2">
          <input type="hidden" name="id" value={vehiculo.id} />
          <select
            name="estado"
            defaultValue={vehiculo.estado}
            onChange={(e) => {
              const form = (e.currentTarget as HTMLSelectElement).closest('form') as HTMLFormElement | null;
              form?.requestSubmit();
            }}
            className="h-9 rounded-md border border-input bg-background px-2 text-xs"
          >
            {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </form>
      </CardContent>
    </Card>
  );
}
