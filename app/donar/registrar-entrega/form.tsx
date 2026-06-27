'use client';
import { useActionState, useMemo, useState } from 'react';
import { crearEntrega, type EntregaState } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Evento { id: string; slug: string; nombre: string }
interface Centro { id: string; nombre: string; tipo: string; evento_id: string | null; direccion: string | null }

export function RegistrarEntregaForm({
  eventos,
  centros
}: { eventos: Evento[]; centros: Centro[] }) {
  const [state, action, pending] = useActionState<EntregaState, FormData>(crearEntrega, null);
  const [eventoId, setEventoId] = useState(eventos[0]?.id ?? '');
  const [centroModo, setCentroModo] = useState<'existente' | 'nuevo'>('existente');

  const centrosDelEvento = useMemo(
    () => centros.filter((c) => c.evento_id === eventoId),
    [centros, eventoId]
  );

  return (
    <form action={action} className="space-y-6">
      {/* Paso 1: Evento */}
      <fieldset className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="default">1</Badge>
          <Label htmlFor="evento_id" className="text-base font-semibold">¿A qué evento donas?</Label>
        </div>
        {eventos.length === 0 ? (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
            No hay eventos activos todavía. Pide a un admin que cree uno.
          </p>
        ) : (
          <select
            id="evento_id"
            name="evento_id"
            required
            value={eventoId}
            onChange={(e) => setEventoId(e.target.value)}
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {eventos.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
        )}
      </fieldset>

      {/* Paso 2: Centro */}
      <fieldset className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="default">2</Badge>
          <Label className="text-base font-semibold">¿En qué centro entregaste?</Label>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className={`cursor-pointer rounded-lg border p-3 text-sm transition-colors ${centroModo === 'existente' ? 'border-primary bg-primary/5' : 'border-input hover:bg-accent'}`}>
            <input
              type="radio"
              name="centro_modo"
              value="existente"
              checked={centroModo === 'existente'}
              onChange={() => setCentroModo('existente')}
              className="mr-2 accent-primary"
            />
            Está en la lista
          </label>
          <label className={`cursor-pointer rounded-lg border p-3 text-sm transition-colors ${centroModo === 'nuevo' ? 'border-primary bg-primary/5' : 'border-input hover:bg-accent'}`}>
            <input
              type="radio"
              name="centro_modo"
              value="nuevo"
              checked={centroModo === 'nuevo'}
              onChange={() => setCentroModo('nuevo')}
              className="mr-2 accent-primary"
            />
            Quiero agregarlo
          </label>
        </div>

        {centroModo === 'existente' ? (
          centrosDelEvento.length === 0 ? (
            <p className="rounded-md border border-muted-foreground/30 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              No hay centros activos para este evento. Cambia a "Quiero agregarlo".
            </p>
          ) : (
            <select
              name="centro_id"
              required
              defaultValue=""
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>Elegí un centro…</option>
              {centrosDelEvento.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}{c.direccion ? ` · ${c.direccion}` : ''}
                </option>
              ))}
            </select>
          )
        ) : (
          <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/20 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="centro_nuevo_nombre">Nombre del centro</Label>
              <Input id="centro_nuevo_nombre" name="centro_nuevo_nombre" placeholder="Centro Norte · Plaza X" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="centro_nuevo_direccion">Dirección o punto de concentración</Label>
              <Input id="centro_nuevo_direccion" name="centro_nuevo_direccion" placeholder="Calle, número, referencia" />
            </div>
            <p className="text-xs text-muted-foreground">
              Un validador lo revisa después; mientras tanto, tu donación queda
              ligada a este centro.
            </p>
          </div>
        )}
      </fieldset>

      {/* Paso 3: Donativo */}
      <fieldset className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="default">3</Badge>
          <Label className="text-base font-semibold">¿Qué entregaste?</Label>
        </div>
        <input type="hidden" name="tipo" value="bienes" />
        <div className="space-y-1.5">
          <Label htmlFor="descripcion">Descripción</Label>
          <textarea
            id="descripcion"
            name="descripcion"
            required
            minLength={3}
            maxLength={400}
            rows={3}
            placeholder="Ej: 5 cajas de agua (1.5 L), 10 paquetes de pañales talla M, medicinas variadas"
            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="valor_estimado_usd">Valor estimado (USD, opcional)</Label>
          <Input
            id="valor_estimado_usd"
            name="valor_estimado_usd"
            type="number"
            min="0"
            step="1"
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">
            Aproximación del valor. Si no sabes, déjalo en cero.
          </p>
        </div>
      </fieldset>

      {state?.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending || eventos.length === 0}>
        {pending ? 'Registrando…' : 'Registrar entrega'}
      </Button>
    </form>
  );
}
