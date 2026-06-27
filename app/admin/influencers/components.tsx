'use client';

import { useActionState, useState } from 'react';
import { setInfluencerRevision, type Result } from './actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Megaphone, AlertTriangle, CheckCircle2, Ban } from 'lucide-react';

interface InfluencerAudit {
  id: string; slug: string; nombre_publico: string;
  verificado_at: string | null; activo: boolean;
  revision_estado: 'ok' | 'sospechoso' | 'desactivado';
  revision_motivo: string | null;
  total_recibido_usd: number;
  count_donaciones: number;
  total_rendido_usd: number;
  rendiciones_verificadas: number;
  rendiciones_pendientes: number;
  ratio_rendicion_pct: number | null;
  denuncias_count: number;
}

function tonoRatio(pct: number | null): 'default' | 'warning' | 'secondary' {
  if (pct === null) return 'secondary';
  if (pct >= 80) return 'default';
  if (pct >= 40) return 'warning';
  return 'warning';
}

export function InfluencerAuditCard({ inf }: { inf: InfluencerAudit }) {
  const [open, setOpen] = useState(false);
  const [state, action, busy] = useActionState<Result, FormData>(setInfluencerRevision, null);

  const sospechoso = inf.revision_estado === 'sospechoso';
  const desactivado = inf.revision_estado === 'desactivado';

  return (
    <Card className={desactivado ? 'opacity-60 border-destructive/40' : sospechoso ? 'border-amber-500/40' : ''}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Megaphone className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{inf.nombre_publico}</p>
              <Badge variant="outline" className="font-mono text-xs">/{inf.slug}</Badge>
              {inf.verificado_at && <Badge variant="default"><CheckCircle2 className="h-3 w-3" /> Verificado</Badge>}
              {sospechoso && <Badge variant="warning"><AlertTriangle className="h-3 w-3" /> Sospechoso</Badge>}
              {desactivado && <Badge variant="warning"><Ban className="h-3 w-3" /> Desactivado</Badge>}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-5">
              <Stat label="Recibido USD" value={`$${(inf.total_recibido_usd ?? 0).toLocaleString()}`} />
              <Stat label="Donaciones" value={inf.count_donaciones} />
              <Stat label="Rendido USD" value={`$${(inf.total_rendido_usd ?? 0).toLocaleString()}`} />
              <Stat label="Rendiciones" value={`${inf.rendiciones_verificadas} ✓ · ${inf.rendiciones_pendientes} ⏳`} />
              <div className="rounded-md border border-border/60 px-2 py-1">
                <p className="text-[10px] uppercase text-muted-foreground">Rendido / Recibido</p>
                <Badge variant={tonoRatio(inf.ratio_rendicion_pct)} className="mt-1">
                  {inf.ratio_rendicion_pct === null ? '—' : `${inf.ratio_rendicion_pct}%`}
                </Badge>
              </div>
            </div>
            {inf.denuncias_count > 0 && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                ⚠ {inf.denuncias_count} {inf.denuncias_count === 1 ? 'denuncia' : 'denuncias'} asociada{inf.denuncias_count === 1 ? '' : 's'}
              </p>
            )}
            {(sospechoso || desactivado) && inf.revision_motivo && (
              <p className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs">
                <strong>Motivo:</strong> {inf.revision_motivo}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
            {open ? 'Cerrar' : 'Revisar'}
          </Button>
        </div>

        {open && (
          <form action={action} className="mt-4 grid gap-3 border-t border-border/60 pt-4 md:grid-cols-3">
            <input type="hidden" name="id" value={inf.id} />
            <div className="space-y-2">
              <Label htmlFor={`estado-${inf.id}`}>Estado de revisión</Label>
              <select
                id={`estado-${inf.id}`} name="estado" defaultValue={inf.revision_estado}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="ok">OK · transparente</option>
                <option value="sospechoso">Sospechoso · marcar público</option>
                <option value="desactivado">Desactivado · quitar de listados</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor={`motivo-${inf.id}`}>Motivo (público si es sospechoso)</Label>
              <Input id={`motivo-${inf.id}`} name="motivo" defaultValue={inf.revision_motivo ?? ''}
                placeholder="Ej: recibió 5000 USD declarados, no publicó rendiciones en 60 días" />
            </div>
            <div className="md:col-span-3 flex items-center gap-3">
              <Button type="submit" disabled={busy}>{busy ? 'Aplicando…' : 'Aplicar'}</Button>
              {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
              {state?.ok && <p className="text-sm text-primary">Actualizado.</p>}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border/60 px-2 py-1">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
