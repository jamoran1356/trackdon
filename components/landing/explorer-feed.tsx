import Link from 'next/link';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PackageOpen, Truck, FileCheck2, AlertTriangle, Megaphone, Warehouse,
  ArrowRight, Clock
} from 'lucide-react';

type FeedItem = {
  id: string;
  kind: 'donacion' | 'distribucion' | 'rendicion' | 'denuncia' | 'influencer_verificado' | 'centro_nuevo';
  ts: string;
  title: string;
  subtitle: string;
  href?: string;
};

export async function ExplorerFeed() {
  const admin = createSupabaseAdmin();

  const [donaciones, distribuciones, rendiciones, denuncias, influencers, centros] = await Promise.all([
    admin.from('donaciones').select('id, descripcion, tipo, valor_estimado_usd, creado_at, centro_recibio_id').order('creado_at', { ascending: false }).limit(10),
    admin.from('distribuciones').select('id, monto_o_descripcion, poblacion_destino, beneficiarios_cantidad, entregado_at, creado_at').order('creado_at', { ascending: false }).limit(10),
    admin.from('rendiciones').select('id, concepto, monto_usd, verificado_at, creado_at').order('creado_at', { ascending: false }).limit(10),
    admin.from('denuncias').select('id, tipo, descripcion, estado, creado_at').order('creado_at', { ascending: false }).limit(10),
    admin.from('influencers').select('id, nombre_publico, slug, verificado_at').not('verificado_at', 'is', null).order('verificado_at', { ascending: false }).limit(10),
    admin.from('centros_acopio').select('id, nombre, tipo, creado_at').order('creado_at', { ascending: false }).limit(10)
  ]);

  type DonRow = { id: string; descripcion: string | null; tipo: string; valor_estimado_usd: number | null; creado_at: string };
  type DistRow = { id: string; monto_o_descripcion: string | null; poblacion_destino: string | null; beneficiarios_cantidad: number | null; entregado_at: string | null; creado_at: string };
  type RendRow = { id: string; concepto: string; monto_usd: number | null; verificado_at: string | null; creado_at: string };
  type DenRow = { id: string; tipo: string; descripcion: string | null; estado: string; creado_at: string };
  type InfRow = { id: string; nombre_publico: string; slug: string; verificado_at: string | null };
  type CenRow = { id: string; nombre: string; tipo: string; creado_at: string };

  const items: FeedItem[] = [
    ...((donaciones.data ?? []) as DonRow[]).map((d) => ({
      id: `don-${d.id}`,
      kind: 'donacion' as const,
      ts: d.creado_at,
      title: d.descripcion ?? `Donación ${d.tipo}`,
      subtitle: d.valor_estimado_usd ? `≈ US$ ${d.valor_estimado_usd}` : `tipo: ${d.tipo}`,
      href: '/publico'
    })),
    ...((distribuciones.data ?? []) as DistRow[]).map((d) => ({
      id: `dist-${d.id}`,
      kind: 'distribucion' as const,
      ts: (d.entregado_at ?? d.creado_at) as string,
      title: d.monto_o_descripcion ?? 'Entrega registrada',
      subtitle: [d.poblacion_destino, d.beneficiarios_cantidad && `${d.beneficiarios_cantidad} beneficiarios`].filter(Boolean).join(' · ') || 'distribución'
    })),
    ...((rendiciones.data ?? []) as RendRow[]).filter((r) => r.verificado_at).map((r) => ({
      id: `rend-${r.id}`,
      kind: 'rendicion' as const,
      ts: r.verificado_at as string,
      title: r.concepto,
      subtitle: r.monto_usd ? `US$ ${r.monto_usd} verificado` : 'rendición verificada'
    })),
    ...((denuncias.data ?? []) as DenRow[]).map((d) => ({
      id: `den-${d.id}`,
      kind: 'denuncia' as const,
      ts: d.creado_at,
      title: `Denuncia: ${d.tipo}`,
      subtitle: (d.descripcion ?? '').slice(0, 80) + ((d.descripcion ?? '').length > 80 ? '…' : '')
    })),
    ...((influencers.data ?? []) as InfRow[]).map((i) => ({
      id: `inf-${i.id}`,
      kind: 'influencer_verificado' as const,
      ts: i.verificado_at as string,
      title: `${i.nombre_publico} verificado`,
      subtitle: `Influencer /${i.slug}`,
      href: `/i/${i.slug}`
    })),
    ...((centros.data ?? []) as CenRow[]).map((c) => ({
      id: `cen-${c.id}`,
      kind: 'centro_nuevo' as const,
      ts: c.creado_at,
      title: `Nuevo centro: ${c.nombre}`,
      subtitle: `tipo ${c.tipo}`
    }))
  ];

  items.sort((a, b) => +new Date(b.ts) - +new Date(a.ts));
  const feed = items.slice(0, 12);

  return (
    <section className="border-t border-border/40 bg-background">
      <div className="container py-16 md:py-24">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Explorador</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Últimos movimientos</h2>
            <p className="mt-2 text-muted-foreground">Cada registro queda público. Si no aparece acá, no existe.</p>
          </div>
          <Link href="/explorar" className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Ver todo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {feed.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="p-10 text-center">
              <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Todavía no hay registros públicos. En cuanto se registren donaciones, centros o rendiciones aparecen acá.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 grid gap-2">
            {feed.map((it) => <FeedRow key={it.id} item={it} />)}
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
  centro_nuevo: { icon: Warehouse, label: 'Centro', tone: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' }
};

function FeedRow({ item }: { item: FeedItem }) {
  const meta = kindMeta[item.kind];
  const Icon = meta.icon;

  const inner = (
    <Card className="transition-colors hover:bg-accent">
      <CardContent className="flex items-start gap-3 p-4">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${meta.tone}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase">{meta.label}</Badge>
            <p className="truncate text-sm font-medium">{item.title}</p>
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
