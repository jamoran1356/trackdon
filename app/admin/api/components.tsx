'use client';

import { useActionState, useState } from 'react';
import { createApiKey, revokeApiKey, deleteApiKey, type CreateState } from './actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Copy, KeyRound, Trash2, Ban } from 'lucide-react';

const SCOPES = [
  { value: 'read', label: 'Lectura completa', desc: 'Acceso a todos los endpoints read-only' },
  { value: 'read:cajas', label: 'Cajas', desc: 'Listar cajas + items + eventos' },
  { value: 'read:donaciones', label: 'Donaciones', desc: 'Listar donaciones registradas' },
  { value: 'read:centros', label: 'Centros', desc: 'Listar centros de acopio' },
  { value: 'read:influencers', label: 'Influencers', desc: 'Listar influencers + auditoría' },
  { value: 'read:eventos', label: 'Eventos', desc: 'Listar eventos activos' },
  { value: 'read:rendiciones', label: 'Rendiciones', desc: 'Listar rendiciones verificadas' },
  { value: 'read:feed', label: 'Feed', desc: 'Acceso al feed en vivo del explorador' }
];

export function CreateKeyForm() {
  const [state, action, busy] = useActionState<CreateState, FormData>(createApiKey, null);
  const [copied, setCopied] = useState(false);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  if (state?.plainKey) {
    return (
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="p-6">
          <h3 className="text-base font-semibold">✓ API key creada</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            <strong>Cópiala ahora.</strong> No la vas a volver a ver — solo guardamos un hash.
          </p>
          <div className="mt-4 flex gap-2">
            <code className="flex-1 break-all rounded-md border border-border bg-background px-3 py-2 font-mono text-sm">
              {state.plainKey}
            </code>
            <Button type="button" onClick={() => copy(state.plainKey!)} size="sm">
              <Copy className="h-4 w-4" /> {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
            Crear otra
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" required minLength={3} placeholder="Integración Manos Solidarias" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expira_at">Expira (opcional)</Label>
          <Input id="expira_at" name="expira_at" type="datetime-local" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descripción</Label>
          <Input id="description" name="description" placeholder="¿Quién usa esta key y para qué?" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Scopes</Label>
        <div className="grid gap-2 md:grid-cols-2">
          {SCOPES.map((s) => (
            <label key={s.value} className="flex items-start gap-2 rounded-md border border-border p-3 text-sm hover:bg-accent cursor-pointer">
              <input type="checkbox" name="scopes" value={s.value} defaultChecked={s.value === 'read'} className="mt-0.5" />
              <div>
                <p className="font-medium">{s.label} <span className="font-mono text-[10px] text-muted-foreground">{s.value}</span></p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}><KeyRound className="h-4 w-4" /> {busy ? 'Generando…' : 'Generar API key'}</Button>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      </div>
    </form>
  );
}

interface KeyRow {
  id: string; name: string; description: string | null;
  key_prefix: string; scopes: string[];
  creado_at: string; expira_at: string | null;
  revocada_at: string | null; last_used_at: string | null;
  call_count: number;
}

export function KeyRowItem({ k }: { k: KeyRow }) {
  const [, revokeAction] = useActionState(revokeApiKey, null);
  const [, delAction] = useActionState(deleteApiKey, null);
  const revoked = !!k.revocada_at;
  const expired = k.expira_at && new Date(k.expira_at) < new Date();

  return (
    <Card className={revoked || expired ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <KeyRound className="mt-1 h-4 w-4 text-primary" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{k.name}</p>
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{k.key_prefix}…</code>
              {revoked && <Badge variant="warning">Revocada</Badge>}
              {!revoked && expired && <Badge variant="warning">Expirada</Badge>}
            </div>
            {k.description && <p className="mt-1 text-xs text-muted-foreground">{k.description}</p>}
            <div className="mt-1 flex flex-wrap gap-1 text-xs">
              {k.scopes.map((s) => (
                <span key={s} className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px]">{s}</span>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {k.call_count} llamadas · {k.last_used_at ? `último uso ${new Date(k.last_used_at).toLocaleString()}` : 'sin uso'}
              {k.expira_at && ` · expira ${new Date(k.expira_at).toLocaleString()}`}
            </p>
          </div>
          {!revoked && (
            <form action={revokeAction}>
              <input type="hidden" name="id" value={k.id} />
              <Button type="submit" variant="ghost" size="icon" aria-label="Revocar"><Ban className="h-4 w-4 text-amber-600" /></Button>
            </form>
          )}
          <form action={delAction}>
            <input type="hidden" name="id" value={k.id} />
            <Button type="submit" variant="ghost" size="icon" aria-label="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
