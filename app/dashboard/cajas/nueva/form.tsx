'use client';

import { useActionState } from 'react';
import { crearCajaBorrador, type ActionState } from '../actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function NuevaCajaForm({ eventos }: { eventos: { id: string; nombre: string; slug: string }[] }) {
  const [state, action, busy] = useActionState<ActionState, FormData>(crearCajaBorrador, null);

  return (
    <Card>
      <CardContent className="p-6">
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título (opcional)</Label>
            <Input id="titulo" name="titulo" placeholder="Ej: Botiquines primera respuesta" maxLength={120} />
            <p className="text-xs text-muted-foreground">Para que después la reconozcas en tu listado.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evento_id">Evento</Label>
            <select
              id="evento_id" name="evento_id"
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— Sin evento específico —</option>
              {eventos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>

          <Button type="submit" disabled={busy}>{busy ? 'Creando…' : 'Crear borrador'}</Button>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
