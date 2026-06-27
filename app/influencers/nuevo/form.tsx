'use client';
import { useActionState } from 'react';
import { crearInfluencer, type InfState } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Evento { id: string; slug: string; nombre: string }

export function NuevoInfluencerForm({ eventos }: { eventos: Evento[] }) {
  const [state, action, pending] = useActionState<InfState, FormData>(crearInfluencer, null);

  return (
    <form action={action} encType="multipart/form-data" className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="nombre_publico">Nombre público</Label>
        <Input id="nombre_publico" name="nombre_publico" required minLength={3} placeholder="Apoyo Caribe Solidario" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug (opcional)</Label>
        <Input id="slug" name="slug" placeholder="apoyo-caribe-solidario" />
        <p className="text-xs text-muted-foreground">URL: /i/&lt;slug&gt;. Se genera del nombre si lo dejas vacío.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="evento_id">Evento al que recolectas</Label>
        {eventos.length === 0 ? (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
            No hay eventos activos. Pide a un admin que cree uno antes de crear tu perfil.
          </p>
        ) : (
          <select
            id="evento_id"
            name="evento_id"
            required
            defaultValue=""
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="" disabled>Elige un evento…</option>
            {eventos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio (opcional)</Label>
        <textarea
          id="bio" name="bio" rows={3} maxLength={400}
          placeholder="Cuenta verificada para la coordinación de ayuda. Cada peso entregado se publica con factura."
          className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatar">Avatar (opcional, jpg/png/webp, &lt;2 MB)</Label>
        <input
          id="avatar" name="avatar" type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
        />
      </div>

      <fieldset className="space-y-3 rounded-lg border border-dashed border-border bg-muted/20 p-4">
        <legend className="px-1 text-sm font-medium">Redes sociales (opcional)</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="twitter_handle">X / Twitter</Label>
            <Input id="twitter_handle" name="twitter_handle" placeholder="usuario (sin @)" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="instagram_handle">Instagram</Label>
            <Input id="instagram_handle" name="instagram_handle" placeholder="usuario (sin @)" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tiktok_handle">TikTok</Label>
            <Input id="tiktok_handle" name="tiktok_handle" placeholder="usuario (sin @)" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="youtube_handle">YouTube</Label>
            <Input id="youtube_handle" name="youtube_handle" placeholder="@canal (sin @)" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="website_url">Sitio web</Label>
          <Input id="website_url" name="website_url" type="url" placeholder="https://…" />
        </div>
      </fieldset>

      {state?.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending || eventos.length === 0}>
        {pending ? 'Creando…' : 'Crear perfil'}
      </Button>
    </form>
  );
}
