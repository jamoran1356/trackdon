'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PackageOpen, Truck, FileCheck2, AlertTriangle, Megaphone, Warehouse,
  Package, ArrowRightLeft, ArrowRight, Clock, Radio
} from 'lucide-react';

type FeedItem = {
  id: string;
  kind: 'donacion' | 'distribucion' | 'rendicion' | 'denuncia' | 'influencer_verificado' | 'centro_nuevo' | 'caja_sellada' | 'caja_movida';
  ts: string;
  title: string;
  subtitle: string;
  href?: string;
};

const POLL_MS = 15_000;

export function ExplorerFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const knownIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;

    async function load(initial = false) {
      try {
        const res = await fetch('/api/explorer/feed', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json() as { items: FeedItem[] };
        if (!alive) return;

        const fresh = new Set<string>();
        if (!initial) {
          for (const it of data.items) {
            if (!knownIds.current.has(it.id)) fresh.add(it.id);
          }
        }
        knownIds.current = new Set(data.items.map((i) => i.id));
        setItems(data.items);
        setLoaded(true);
        if (fresh.size > 0) {
          setNewIds(fresh);
          setTimeout(() => {
            setNewIds(new Set());
          }, 4000);
        }
      } catch {
        // silent
      }
    }

    load(true);
    const id = setInterval(() => load(false), POLL_MS);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return (
    <section className="border-t border-border/40 bg-background">
      <div className="container py-16 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              Explorador en vivo
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Últimos movimientos</h2>
            <p className="mt-2 text-muted-foreground">Cada registro queda público. Actualiza cada 15 segundos.</p>
          </div>
          <Link href="/explorar" className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Ver todo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {!loaded ? (
          <Card className="mt-8">
            <CardContent className="p-10 text-center">
              <Radio className="mx-auto h-8 w-8 animate-pulse text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">Conectando al feed…</p>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="p-10 text-center">
              <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Todavía no hay registros públicos. En cuanto se registren donaciones, centros o rendiciones aparecen aquí en vivo.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 grid gap-2">
            {items.map((it) => <FeedRow key={it.id} item={it} isNew={newIds.has(it.id)} />)}
          </div>
        )}

        <div className="mt-6 md:hidden">
          <Link href="/explorar" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Ver todo en el explorador <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

const kindMeta: Record<FeedItem['kind'], { icon: React.ComponentType<{ className?: string }>; label: string; tone: string }> = {
  donacion: { icon: PackageOpen, label: 'Donación', tone: 'bg-primary/10 text-primary' },
  distribucion: { icon: Truck, label: 'Distribución', tone: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  rendicion: { icon: FileCheck2, label: 'Rendición', tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  denuncia: { icon: AlertTriangle, label: 'Denuncia', tone: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  influencer_verificado: { icon: Megaphone, label: 'Influencer', tone: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400' },
  centro_nuevo: { icon: Warehouse, label: 'Centro', tone: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
  caja_sellada: { icon: Package, label: 'Caja sellada', tone: 'bg-primary/10 text-primary' },
  caja_movida: { icon: ArrowRightLeft, label: 'Caja en tránsito', tone: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' }
};

function FeedRow({ item, isNew }: { item: FeedItem; isNew: boolean }) {
  const meta = kindMeta[item.kind];
  const Icon = meta.icon;

  const inner = (
    <Card
      className={`transition-all duration-500 hover:bg-accent ${
        isNew ? 'animate-fade-up border-primary/60 shadow-md ring-2 ring-primary/30' : ''
      }`}
    >
      <CardContent className="flex items-start gap-3 p-4">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${meta.tone}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase">{meta.label}</Badge>
            <p className="truncate text-sm font-medium">{item.title}</p>
            {isNew && <Badge variant="default" className="text-[10px]">NUEVO</Badge>}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.subtitle}</p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(item.ts)}</span>
      </CardContent>
    </Card>
  );

  return item.href ? <Link href={item.href}>{inner}</Link> : <div>{inner}</div>;
}

function relativeTime(iso: string): string {
  const diff = (Date.now() - +new Date(iso)) / 1000;
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} d`;
}
