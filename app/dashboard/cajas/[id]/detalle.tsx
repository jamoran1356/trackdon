'use client';

import { useActionState } from 'react';
import { agregarItem, eliminarItem, asignarCentro, sellarCaja, type ActionState } from '../actions';
import { InviteOrganizacionForm } from '@/app/donar/registrar-entrega/invite-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Lock } from 'lucide-react';

interface Caja {
  id: string; codigo: string; titulo: string | null; estado: string;
  centro_destino_id: string | null; evento_id: string | null;
  creado_at: string; sellada_at: string | null;
  receptor_descripcion: string | null;
}
interface Item {
  id: string; descripcion: string; cantidad: number; unidad: string;
  subcategoria: string | null; notas: string | null;
}
interface Centro { id: string; nombre: string; evento_id: string | null }

interface Props {
  caja: Caja;
  items: Item[];
  centros: Centro[];
  eventos: { id: string; nombre: string }[];
}

export function CajaDetalle({ caja, items, centros }: Props) {
  const [addState, addAction, addBusy] = useActionState<ActionState, FormData>(agregarItem, null);
  const [delState, delAction, delBusy] = useActionState<ActionState, FormData>(eliminarItem, null);
  const [centroState, centroAction, centroBusy] = useActionState<ActionState, FormData>(asignarCentro, null);
  const [sellState, sellAction, sellBusy] = useActionState<ActionState, FormData>(sellarCaja, null);

  const isBorrador = caja.estado === 'borrador';
  const centrosDelEvento = caja.evento_id
    ? centros.filter((c) => c.evento_id === caja.evento_id)
    : centros;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono">{caja.codigo}</Badge>
          <Badge variant={isBorrador ? 'outline' : 'default'}>{caja.estado}</Badge>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
          {caja.titulo ?? 'Caja sin título'}
        </h1>
        <p className="text-sm text-muted-foreground">Creada {new Date(caja.creado_at).toLocaleString()}</p>
      </div>

      {/* Items */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-1 text-base font-semibold">Contenido ({items.length})</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            {isBorrador
              ? 'Lista uno por uno lo que va adentro. Cantidad + descripción + subcategoría si aplica.'
              : 'La caja ya está sellada. Lo de adentro es inmutable.'}
          </p>

          {items.length === 0 ? (
            <p className="rounded-md border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
              Sin items todavía.
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.id} className="flex items-start gap-3 rounded-md border border-border/60 p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {it.cantidad} {it.unidad} · {it.descripcion}
                      {it.subcategoria && <span className="text-muted-foreground"> ({it.subcategoria})</span>}
                    </p>
                    {it.notas && <p className="mt-0.5 text-xs text-muted-foreground">{it.notas}</p>}
                  </div>
                  {isBorrador && (
                    <form action={delAction}>
                      <input type="hidden" name="item_id" value={it.id} />
                      <Button type="submit" variant="ghost" size="icon" disabled={delBusy} aria-label="Eliminar">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}

          {isBorrador && (
            <form action={addAction} className="mt-4 grid gap-3 rounded-md border border-border/60 bg-muted/30 p-4 md:grid-cols-6">
              <input type="hidden" name="caja_id" value={caja.id} />
              <div className="md:col-span-1 space-y-2">
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input id="cantidad" name="cantidad" type="number" min={1} step="any" required defaultValue={1} />
              </div>
              <div className="md:col-span-1 space-y-2">
                <Label htmlFor="unidad">Unidad</Label>
                <Input id="unidad" name="unidad" defaultValue="unidad" placeholder="pares, kg, …" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Input id="descripcion" name="descripcion" required placeholder="curitas, gasas, zapatos…" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="subcategoria">Subcategoría (opcional)</Label>
                <Input id="subcategoria" name="subcategoria" placeholder="adulto hombre, niño, …" />
              </div>
              <div className="md:col-span-6 space-y-2">
                <Label htmlFor="notas">Notas (opcional)</Label>
                <Input id="notas" name="notas" placeholder="estado, marca, talla, etc" />
              </div>
              <div className="md:col-span-6 flex items-center gap-3">
                <Button type="submit" disabled={addBusy}>
                  <Plus className="h-4 w-4" /> {addBusy ? 'Agregando…' : 'Agregar item'}
                </Button>
                {addState?.error && <p className="text-sm text-destructive">{addState.error}</p>}
                {addState?.ok && <p className="text-sm text-primary">Agregado.</p>}
              </div>
            </form>
          )}
          {delState?.error && <p className="mt-3 text-sm text-destructive">{delState.error}</p>}
        </CardContent>
      </Card>

      {/* Centro destino */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-1 text-base font-semibold">Centro destino</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            ¿A qué centro de acopio le entregas esta caja?
          </p>

          {isBorrador && centrosDelEvento.length > 0 && (
            <form action={centroAction} className="flex flex-col gap-3 md:flex-row md:items-end">
              <input type="hidden" name="caja_id" value={caja.id} />
              <div className="flex-1 space-y-2">
                <Label htmlFor="centro_id">Elegir centro</Label>
                <select
                  id="centro_id" name="centro_id" defaultValue={caja.centro_destino_id ?? ''}
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">— Ninguno —</option>
                  {centrosDelEvento.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <Button type="submit" disabled={centroBusy}>{centroBusy ? 'Guardando…' : 'Guardar'}</Button>
              {centroState?.error && <p className="text-sm text-destructive">{centroState.error}</p>}
              {centroState?.ok && <p className="text-sm text-primary">Asignado.</p>}
            </form>
          )}

          {isBorrador && centrosDelEvento.length === 0 && (
            <div className="space-y-3">
              <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
                No hay centros activos para este evento. Invita uno.
              </p>
              <InviteOrganizacionForm eventoId={caja.evento_id} />
            </div>
          )}

          {!isBorrador && (
            <p className="text-sm">
              {caja.centro_destino_id ? '✓ Centro asignado.' : 'Sin centro.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sellar */}
      {isBorrador && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-6">
            <h2 className="text-base font-semibold">Sellar caja</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Al sellar, los items quedan inmutables y la caja entra al libro público.
              Necesita al menos 1 item y un centro asignado.
            </p>
            <form action={sellAction} className="mt-4">
              <input type="hidden" name="caja_id" value={caja.id} />
              <Button type="submit" disabled={sellBusy || items.length === 0 || !caja.centro_destino_id}>
                <Lock className="h-4 w-4" /> {sellBusy ? 'Sellando…' : 'Sellar y publicar'}
              </Button>
              {sellState?.error && <p className="mt-2 text-sm text-destructive">{sellState.error}</p>}
            </form>
          </CardContent>
        </Card>
      )}

      {caja.receptor_descripcion && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold">Distribuida</h2>
            <p className="mt-1 text-sm">Receptor final: <strong>{caja.receptor_descripcion}</strong></p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
