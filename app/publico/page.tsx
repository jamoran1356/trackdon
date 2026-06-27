import Link from 'next/link';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Stat } from '@/components/ui/stat';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatUsd, formatNumber } from '@/lib/utils';
import {
  getTotalesPublico,
  getDonacionesRecientes,
  getCentrosActivos,
  getInfluencersConRendicion
} from '@/lib/supabase/queries';
import { getEventosActivos } from '@/lib/supabase/eventos';
import { Box, HeartHandshake, Megaphone, ShieldCheck, Users, Wallet, MapPin, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Panel público' };
export const revalidate = 60;  // refresh aggregates once per minute

const estadoBadge: Record<string, { label: string; v: 'default' | 'success' | 'warning' | 'info' }> = {
  pendiente: { label: 'Pendiente', v: 'warning' },
  recibida: { label: 'Recibida', v: 'info' },
  en_transito: { label: 'En tránsito', v: 'default' },
  distribuida: { label: 'Distribuida', v: 'success' }
};

const tipoCentroLabel: Record<string, string> = {
  fisico: 'Físico',
  comprador_medicamentos: 'Compras medicamentos'
};

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'ahora';
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

const categoriaLabel: Record<string, string> = {
  terremoto: 'Terremoto',
  inundacion: 'Inundación',
  huracan: 'Huracán',
  incendio: 'Incendio',
  conflicto: 'Conflicto',
  crisis_humanitaria: 'Crisis humanitaria',
  otro: 'Otro'
};

export default async function PublicoPage() {
  const [totales, donacionesRes, centrosRes, influencersRes, eventos] = await Promise.all([
    getTotalesPublico(),
    getDonacionesRecientes(8),
    getCentrosActivos(8),
    getInfluencersConRendicion(8),
    getEventosActivos()
  ]);

  const donaciones = donacionesRes.data;
  const centros = centrosRes.data;
  const influencers = influencersRes.data;

  return (
    <>
      <SiteHeader />
      <main className="container py-8 md:py-12">
        <div className="mb-8 flex flex-col gap-3 md:mb-12">
          <Badge variant="outline" className="w-fit">Vista pública · datos en vivo</Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Panel público</h1>
          <p className="max-w-2xl text-muted-foreground">
            Cualquier persona puede ver desde aquí cuánto se ha movido,
            qué centros e influencers están activos y el estado de cada
            donación. La identidad de los damnificados nunca aparece —
            solo pseudónimos.
          </p>
        </div>

        {/* Eventos activos */}
        {eventos.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">Eventos en curso</h2>
              {eventos.length > 3 && (
                <Link href="#" className="text-sm text-primary hover:underline">Ver todos</Link>
              )}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {eventos.slice(0, 6).map((e) => (
                <Link key={e.evento_id} href={`/e/${e.slug}`} className="group">
                  <div className="rounded-2xl border bg-card p-5 transition-colors hover:border-primary/40">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{categoriaLabel[e.categoria] ?? e.categoria}</Badge>
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        ver <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                    <p className="mt-3 font-semibold text-base">{e.nombre}</p>
                    {e.lugar && (
                      <p className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {e.lugar}
                      </p>
                    )}
                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Donado</p>
                        <p className="mt-0.5 font-mono font-semibold">{formatUsd(Number(e.total_donaciones_usd))}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Entregado</p>
                        <p className="mt-0.5 font-mono font-semibold">{formatUsd(Number(e.total_rendido_usd))}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Centros</p>
                        <p className="mt-0.5 font-mono font-semibold">{e.centros_activos}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Stats */}
        <section className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Stat label="Total donado" value={formatUsd(Number(totales.total_donaciones_usd))} icon={<Wallet className="h-5 w-5" />} />
          <Stat label="Donaciones" value={formatNumber(Number(totales.cantidad_donaciones))} icon={<HeartHandshake className="h-5 w-5" />} />
          <Stat label="Centros activos" value={String(totales.centros_activos)} icon={<Box className="h-5 w-5" />} />
          <Stat label="Influencers" value={String(totales.influencers_activos)} icon={<Megaphone className="h-5 w-5" />} />
          <Stat label="Damnificados" value={formatNumber(Number(totales.damnificados_registrados))} icon={<Users className="h-5 w-5" />} />
          <Stat label="Total rendido" value={formatUsd(Number(totales.total_rendido_usd))} icon={<ShieldCheck className="h-5 w-5" />} />
        </section>

        {/* Donaciones recientes */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Donaciones recientes</h2>
            <Link href="#" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </div>
          <Card className="mt-4 overflow-hidden">
            {donaciones.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Todavía no hay donaciones registradas. Sé el primero — pulsa <Link href="/donar" className="text-primary hover:underline">Donar</Link>.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {donaciones.map((d: any) => {
                  const destino = d.centro?.nombre ?? d.influencer?.nombre_publico ?? 'Sin destino aún';
                  const donante = d.donante?.nombre_mostrado ?? 'Anónimo';
                  const e = estadoBadge[d.estado] ?? { label: d.estado, v: 'default' as const };
                  return (
                    <div key={d.id} className="grid gap-2 p-4 md:grid-cols-[1fr_auto_auto] md:items-center md:gap-6">
                      <div>
                        <p className="font-medium">{d.descripcion ?? 'Donación'}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{donante} → {destino}</p>
                      </div>
                      <p className="font-mono text-sm md:text-base">{formatUsd(Number(d.valor_estimado_usd ?? 0))}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={e.v}>{e.label}</Badge>
                        <span className="text-xs text-muted-foreground">{relativeTime(d.creado_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </section>

        {/* Two columns */}
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Centros de acopio activos</CardTitle>
              <CardDescription>Centros operando ahora.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {centros.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No hay centros activos todavía.</p>
              ) : centros.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {tipoCentroLabel[c.tipo] ?? c.tipo} · alta {relativeTime(c.creado_at)}
                    </p>
                  </div>
                  <Badge variant="success">activo</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Influencers / fundaciones</CardTitle>
              <CardDescription>Recibido vs. ya rendido (con comprobante).</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {influencers.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No hay influencers registrados todavía.</p>
              ) : influencers.map((i) => {
                const pct = i.recibido ? Math.round((i.entregado / i.recibido) * 100) : 0;
                const nombreEl = i.slug ? (
                  <Link href={`/i/${i.slug}`} className="font-medium hover:underline">{i.nombre}</Link>
                ) : (
                  <p className="font-medium">{i.nombre}</p>
                );
                return (
                  <div key={i.id} className="p-4">
                    <div className="flex items-center justify-between">
                      {nombreEl}
                      <p className="font-mono text-sm tabular-nums">
                        {formatUsd(i.entregado)} / {formatUsd(i.recibido)}
                      </p>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {i.recibido === 0
                        ? 'Sin donaciones todavía'
                        : pct === 100
                          ? 'Entrega verificada al 100%'
                          : `${pct}% entregado (con factura) · ${formatUsd(i.pendiente_verif)} pendiente de verificar`}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
