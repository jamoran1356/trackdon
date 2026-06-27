import Link from 'next/link';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Stat } from '@/components/ui/stat';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatUsd, formatNumber } from '@/lib/utils';
import { mockTotales, mockDonacionesPublicas, mockCentros, mockInfluencers } from '@/lib/mock';
import { Box, HeartHandshake, Megaphone, ShieldCheck, Users, Wallet } from 'lucide-react';

export const metadata = { title: 'Panel público' };

const estadoBadge: Record<string, { label: string; v: 'default' | 'success' | 'warning' | 'info' }> = {
  pendiente: { label: 'Pendiente', v: 'warning' },
  recibida: { label: 'Recibida', v: 'info' },
  en_transito: { label: 'En tránsito', v: 'default' },
  distribuida: { label: 'Distribuida', v: 'success' }
};

export default function PublicoPage() {
  return (
    <>
      <SiteHeader />
      <main className="container py-8 md:py-12">
        <div className="mb-8 flex flex-col gap-3 md:mb-12">
          <Badge variant="outline" className="w-fit">Vista pública · datos mock</Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Panel público</h1>
          <p className="max-w-2xl text-muted-foreground">
            Cualquier persona puede ver desde aquí cuánto se ha movido,
            qué centros e influencers están activos y el estado de cada
            donación. La identidad de los damnificados nunca aparece —
            solo pseudónimos.
          </p>
        </div>

        {/* Stats */}
        <section className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Stat label="Total donado" value={formatUsd(mockTotales.total_donaciones_usd)} icon={<Wallet className="h-5 w-5" />} />
          <Stat label="Donaciones" value={formatNumber(mockTotales.cantidad_donaciones)} icon={<HeartHandshake className="h-5 w-5" />} />
          <Stat label="Centros activos" value={String(mockTotales.centros_activos)} icon={<Box className="h-5 w-5" />} />
          <Stat label="Influencers" value={String(mockTotales.influencers_activos)} icon={<Megaphone className="h-5 w-5" />} />
          <Stat label="Damnificados" value={formatNumber(mockTotales.damnificados_registrados)} icon={<Users className="h-5 w-5" />} />
          <Stat label="Total rendido" value={formatUsd(mockTotales.total_rendido_usd)} icon={<ShieldCheck className="h-5 w-5" />} />
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
            <div className="divide-y divide-border">
              {mockDonacionesPublicas.map((d) => (
                <div key={d.id} className="grid gap-2 p-4 md:grid-cols-[1fr_auto_auto] md:items-center md:gap-6">
                  <div>
                    <p className="font-medium">{d.descripcion}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {d.donante} → {d.centro}
                    </p>
                  </div>
                  <p className="font-mono text-sm md:text-base">{formatUsd(d.valor)}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={estadoBadge[d.estado].v}>{estadoBadge[d.estado].label}</Badge>
                    <span className="text-xs text-muted-foreground">hace {d.creado}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Two columns */}
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Centros de acopio activos</CardTitle>
              <CardDescription>Volumen actual e items registrados.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {mockCentros.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.tipo === 'fisico' ? 'Físico' : 'Compras medicamentos'} · último mov. hace {c.ultimo}
                    </p>
                  </div>
                  <p className="font-mono text-sm tabular-nums">{formatNumber(c.items)} items</p>
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
              {mockInfluencers.map((i) => {
                const pct = i.recibido ? Math.round((i.rendido / i.recibido) * 100) : 0;
                return (
                  <div key={i.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{i.nombre}</p>
                      <p className="font-mono text-sm tabular-nums">
                        {formatUsd(i.rendido)} / {formatUsd(i.recibido)}
                      </p>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {pct === 100 ? 'Rendición completa' : `${pct}% rendido · ${formatUsd(i.pendiente)} pendiente`}
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
