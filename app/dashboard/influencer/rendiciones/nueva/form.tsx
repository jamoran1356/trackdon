'use client';
import { useActionState } from 'react';
import { crearRendicion, type RendicionState } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DESTINOS = [
  { id: 'compra_insumos', label: 'Compra de insumos' },
  { id: 'transferencia_centro', label: 'Transferencia a centro de acopio' },
  { id: 'entrega_directa', label: 'Entrega directa a damnificado' },
  { id: 'otro', label: 'Otro' }
];

export function NuevaRendicionForm() {
  const [state, action, pending] = useActionState<RendicionState, FormData>(crearRendicion, null);

  return (
    <form action={action} encType="multipart/form-data" className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="concepto">Concepto</Label>
        <Input id="concepto" name="concepto" required minLength={3} placeholder="Compra medicamentos · farmacia X" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="monto_usd">Monto (USD)</Label>
          <Input id="monto_usd" name="monto_usd" type="number" min="0" step="0.01" required placeholder="0" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="destino_tipo">Destino</Label>
          <select
            id="destino_tipo" name="destino_tipo" required defaultValue="compra_insumos"
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {DESTINOS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comprobante">Comprobante (foto o PDF, máx 10 MB)</Label>
        <input
          id="comprobante" name="comprobante" type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
        />
        <p className="text-xs text-muted-foreground">
          Sin comprobante la rendición igual queda registrada — pero el validador
          probablemente la rechace. Súbelo para acelerar la verificación.
        </p>
      </div>

      {state?.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Subiendo…' : 'Crear rendición'}
      </Button>
    </form>
  );
}
