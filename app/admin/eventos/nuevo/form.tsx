'use client';
import { useActionState } from 'react';
import { crearEvento, type EventoState } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CATEGORIAS = [
  { id: 'terremoto', label: 'Terremoto' },
  { id: 'inundacion', label: 'Inundación' },
  { id: 'huracan', label: 'Huracán' },
  { id: 'incendio', label: 'Incendio' },
  { id: 'conflicto', label: 'Conflicto' },
  { id: 'crisis_humanitaria', label: 'Crisis humanitaria' },
  { id: 'otro', label: 'Otro' }
];

export function EventoForm() {
  const [state, action, pending] = useActionState<EventoState, FormData>(crearEvento, null);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" name="nombre" required minLength={3} placeholder="Terremoto 2026 — costa caribe" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug (opcional)</Label>
        <Input id="slug" name="slug" placeholder="terremoto-costa-caribe-2026" />
        <p className="text-xs text-muted-foreground">URL: /e/&lt;slug&gt;. Si lo dejas vacío, se genera del nombre.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoría</Label>
          <select
            id="categoria"
            name="categoria"
            required
            defaultValue="otro"
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {CATEGORIAS.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fecha_inicio">Fecha de inicio</Label>
          <Input id="fecha_inicio" name="fecha_inicio" type="date" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lugar">Lugar (texto libre)</Label>
        <Input id="lugar" name="lugar" placeholder="Región caribe · LatAm" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="banner_url">Banner URL (opcional)</Label>
        <Input id="banner_url" name="banner_url" type="url" placeholder="https://…" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={4}
          maxLength={2000}
          className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Contexto breve del evento, qué se necesita, a quién va dirigido."
        />
      </div>

      {state?.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Creando…' : 'Crear evento'}
      </Button>
    </form>
  );
}
