'use client';

import { useActionState } from 'react';
import { addPatrocinador, togglePatrocinador, deletePatrocinador } from './actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, ExternalLink } from 'lucide-react';

export function PatrocinadorForm() {
  const [state, action, busy] = useActionState(addPatrocinador, null);

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="empresa">Empresa</Label>
        <Input id="empresa" name="empresa" placeholder="ACME Corp" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="orden">Orden</Label>
        <Input id="orden" name="orden" type="number" defaultValue={0} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="logo_url">Logo URL</Label>
        <Input id="logo_url" name="logo_url" type="url" placeholder="https://...png" required />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="url">URL del patrocinador (opcional)</Label>
        <Input id="url" name="url" type="url" placeholder="https://acme.com" />
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={busy}>{busy ? 'Agregando…' : 'Agregar'}</Button>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state?.ok && <p className="text-sm text-primary">Patrocinador agregado.</p>}
      </div>
    </form>
  );
}

interface Patrocinador {
  id: string; empresa: string; logo_url: string; url: string | null;
  orden: number; activo: boolean;
}

export function PatrocinadorRow({ patrocinador }: { patrocinador: Patrocinador }) {
  const [toggleState, toggleAction] = useActionState(togglePatrocinador, null);
  const [delState, delAction, delBusy] = useActionState(deletePatrocinador, null);

  return (
    <Card className={patrocinador.activo ? '' : 'opacity-60'}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg border border-border/60 bg-background overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={patrocinador.logo_url} alt={patrocinador.empresa} className="max-h-12 max-w-12 object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{patrocinador.empresa}</p>
          {patrocinador.url ? (
            <a href={patrocinador.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 truncate text-xs text-primary hover:underline">
              <ExternalLink className="h-3 w-3" /> {patrocinador.url}
            </a>
          ) : (
            <p className="text-xs text-muted-foreground">sin URL</p>
          )}
          <p className="text-xs text-muted-foreground">orden: {patrocinador.orden}</p>
          {toggleState?.error && <p className="text-xs text-destructive">{toggleState.error}</p>}
        </div>
        <form action={toggleAction}>
          <input type="hidden" name="id" value={patrocinador.id} />
          <Switch name="activo" defaultChecked={patrocinador.activo} onChange={(e) => {
            const form = (e.currentTarget as HTMLInputElement).closest('form');
            if (form) (form as HTMLFormElement).requestSubmit();
          }} />
        </form>
        <form action={delAction}>
          <input type="hidden" name="id" value={patrocinador.id} />
          <Button type="submit" variant="ghost" size="icon" disabled={delBusy} aria-label="Eliminar">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
          {delState?.error && <p className="text-xs text-destructive">{delState.error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
