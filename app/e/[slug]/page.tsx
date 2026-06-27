import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Stat } from '@/components/ui/stat';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatUsd, formatNumber } from '@/lib/utils';
import { getEventoBySlug, getEventoIdBySlug } from '@/lib/supabase/eventos';
import { createSupabaseServer } from '@/lib/supabase/server';
import {
  Wallet,
  HeartHandshake,
  Box,
  Megaphone,
  Users,
  ShieldCheck,
  MapPin,
  Calendar,
  ArrowRight
} from 'lucide-react';

export const revalidate = 60;
interface Params { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const e = await getEventoBySlug(slug);
  if (!e) return { title: 'Evento no encontrado' };
  return {
    title: e.nombre,
    description: `Tracking de donaciones para ${e.nombre}${e.lugar ? ' · ' + e.lugar : ''}`
  };
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

export default async function EventoPage({ params }: Params) {
  const { slug } = await params;
  const e = await getEventoBySlug(slug);
  if (!e) notFound();

  const eventoId = await getEventoIdBySlug(slug);
  const supabase = await createSupabaseServer();
  const [centrosRes, influencersRes] = await Promise.all([
    supabase
      .from('centros_acopio')
      .select('id, nombre, tipo')
      .eq('evento_id', eventoId ?? '')
      .eq('activo', true)
      .limit(8),
    supabase
      .from('v_influencer_perfil')
      .select('id, slug, nombre_publico, recibido_usd, entregado_usd')
      .limit(8)
  ]);

  return (
    <>
      <SiteHeader />
      <main className="container py-8 md:py-12">
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{categoriaLabel[e.categoria] ?? e.categoria}</Badge>
            {e.activo && <Badge variant="success">Evento activo</Badge>}
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{e.nombre}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {e.lugar && (
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {e.lugar}</span>
            )}
            {e.fecha_inicio && (
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Desde {e.fecha_inicio}</span>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Stat label="Total donado" value={formatUsd(Number(e.total_donaciones_usd))} icon={<Wallet className="h-5 w-5" />} />
          <Stat label="Donaciones" value={formatNumber(Number(e.cantidad_donaciones))} icon={<HeartHandshake className="h-5 w-5" />} />
          <Stat label="Centros activos" value={String(e.centros_activos)} icon={<Box className="h-5 w-5" />} />
          <Stat label="Influencers" value={String(e.influencers_activos)} icon={<Megaphone className="h-5 w-5" />} />
          <Stat label="Damnificados" value={formatNumber(Number(e.damnificados_registrados))} icon={<Users className="h-5 w-5" />} />
          <Stat label="Entregado" value={formatUsd(Number(e.total_rendido_usd))} icon={<ShieldCheck className="h-5 w-5" />} />
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Centros de acopio</CardTitle>
              <CardDescription>Operando en este evento.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {(centrosRes.data ?? []).length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No hay centros activos todavía.</p>
              ) : (
                (centrosRes.data ?? []).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-4">
                    <p className="font-medium">{c.nombre}</p>
                    <Badge variant="outline">{c.tipo === 'fisico' ? 'Físico' : 'Compras medicamentos'}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Influencers / fundaciones</CardTitle>
              <CardDescription>Recibido vs. entregado verificado.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {(influencersRes.data ?? []).length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No hay influencers todavía.</p>
              ) : (
                (influencersRes.data ?? []).map((i: any) => {
                  const recibido = Number(i.recibido_usd ?? 0);
                  const entregado = Number(i.entregado_usd ?? 0);
                  return (
                    <div key={i.id} className="p-4">
                      <div className="flex items-center justify-between">
                        {i.slug ? (
                          <Link href={`/i/${i.slug}`} className="font-medium hover:underline">{i.nombre_publico}</Link>
                        ) : (
                          <p className="font-medium">{i.nombre_publico}</p>
                        )}
                        <p className="font-mono text-sm tabular-nums">
                          {formatUsd(entregado)} / {formatUsd(recibido)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </section>

        <section className="mt-10 text-center">
          <Button asChild size="lg">
            <Link href={`/donar?evento=${e.slug}`}>
              Donar a este evento <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
