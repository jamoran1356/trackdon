'use client';

import { useActionState } from 'react';
import { addCosto, deleteCosto, type Result } from './actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, DollarSign } from 'lucide-react';

const CAT_LABEL: Record<string, string> = {
  combustible: 'Combustible',
  mantenimiento_vehiculo: 'Mantenimiento',
  mano_de_obra: 'Mano de obra',
  alquiler: 'Alquiler',
  servicios: 'Servicios',
  logistica: 'Logística',
  empaque: 'Empaque',
  otros: 'Otros'
};

interface Costo {
  id: string; categoria: string; descripcion: string | null;
  monto_usd: number; fecha: string;
}

export function AddCostoForm({ centroId }: { centroId: string }) {
  const [state, action, busy] = useActionState<Result, FormData>(addCosto, null);
  return (
    <form action={action} className="grid gap-4 md:grid-cols-4">
      <input type="hidden" name="centro_id" value={centroId} />
      <div className="space-y-2">
        <Label htmlFor="fecha">Fecha</Label>
        <Input id="fecha" name="fecha" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="categoria">Categoría</Label>
        <select id="categoria" name="categoria" defaultValue="combustible"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          {Object.entries(CAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="monto_usd">Monto USD</Label>
        <Input id="monto_usd" name="monto_usd" type="number" step="0.01" min={0} required defaultValue={0} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Input id="descripcion" name="descripcion" placeholder="Diesel camión TX-42" />
      </div>
      <div className="md:col-span-4 flex items-center gap-3">
        <Button type="submit" disabled={busy}>{busy ? 'Agregando…' : 'Agregar costo'}</Button>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state?.ok && <p className="text-sm text-primary">Costo agregado.</p>}
      </div>
    </form>
  );
}

export function CostoRow({ costo }: { costo: Costo }) {
  const [, delAction] = useActionState<Result, FormData>(deleteCosto, null);
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <DollarSign className="h-4 w-4 text-emerald-600" />
        <div className="flex-1">
          <p className="text-sm font-medium">{CAT_LABEL[costo.categoria] ?? costo.categoria} · ${Number(costo.monto_usd).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(costo.fecha).toLocaleDateString()}{costo.descripcion ? ` · ${costo.descripcion}` : ''}
          </p>
        </div>
        <form action={delAction}>
          <input type="hidden" name="id" value={costo.id} />
          <Button type="submit" variant="ghost" size="icon" aria-label="Eliminar">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
