import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Stat } from '@/components/ui/stat';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatUsd } from '@/lib/utils';
import {
  getInfluencerBySlug,
  getRendicionesVerificadasInfluencer
} from '@/lib/supabase/queries';
import { Wallet, ShieldCheck, ReceiptText, Globe, ArrowRight, Instagram, Youtube, Music2 } from 'lucide-react';

export const revalidate = 60;

interface Params { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const { data } = await getInfluencerBySlug(slug);
  if (!data) return { title: 'Influencer no encontrado' };
  return {
    title: data.nombre_publico,
    description: data.bio ?? `Perfil público de ${data.nombre_publico} en trackdon`
  };
}

const destinoLabel: Record<string, string> = {
  compra_insumos: 'Compra de insumos',
  transferencia_centro: 'Transferencia a centro',
  entrega_directa: 'Entrega directa',
  otro: 'Otro'
};

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.max(1, Math.floor(ms / 60_000));
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

// Inline X (Twitter) glyph since lucide ya no tiene Twitter
function XIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={props.className} fill="currentColor" aria-hidden>
      <path d="M18.244 2H21l-6.49 7.42L22 22h-6.59l-4.46-6.13L5.71 22H3l6.94-7.94L2 2h6.7l4.04 5.6L18.244 2zm-2.31 18h1.73L7.17 4H5.34l10.594 16z" />
    </svg>
  );
}
function TikTokIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={props.className} fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V9.32a8.16 8.16 0 0 0 4.77 1.52V7.4a4.85 4.85 0 0 1-1.84-.71z" />
    </svg>
  );
}

export default async function InfluencerPage({ params }: Params) {
  const { slug } = await params;
  const { data: i } = await getInfluencerBySlug(slug);
  if (!i) notFound();

  const { data: rendiciones } = await getRendicionesVerificadasInfluencer(i.id);

  // Estado de revisión pública (auditoría admin)
  const { createSupabaseAdmin } = await import('@/lib/supabase/server');
  const admin = createSupabaseAdmin();
  const { data: rev } = await admin
    .from('influencers')
    .select('revision_estado, revision_motivo')
    .eq('id', i.id)
    .maybeSingle();
  const sospechoso = rev?.revision_estado === 'sospechoso';
  const desactivado = rev?.revision_estado === 'desactivado';

  const recibido = Number(i.recibido_usd ?? 0);
  const entregado = Number(i.entregado_usd ?? 0);
  const pendienteVerif = Number(i.pendiente_verif_usd ?? 0);
  const pct = recibido ? Math.round((entregado / recibido) * 100) : 0;

  const initial = (i.nombre_publico ?? '?').trim().charAt(0).toUpperCase();

  return (
    <>
      <SiteHeader />
      <main className="container py-8 md:py-12">
        {/* HEAD */}
        <section className="flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-8">
          {i.avatar_url ? (
            <img
              src={i.avatar_url}
              alt={i.nombre_publico}
              className="h-24 w-24 rounded-2xl border border-border object-cover md:h-28 md:w-28"
            />
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-2xl bg-primary/10 text-3xl font-bold text-primary md:h-28 md:w-28">
              {initial}
            </div>
          )}
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">Perfil público · influencer</Badge>
              {sospechoso && <Badge variant="warning">⚠ Marcado como sospechoso por el equipo</Badge>}
              {desactivado && <Badge variant="warning">Cuenta desactivada</Badge>}
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{i.nombre_publico}</h1>
            {(sospechoso || desactivado) && rev?.revision_motivo && (
              <p className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
                <strong>Motivo público:</strong> {rev.revision_motivo}
              </p>
            )}
            {i.bio && <p className="mt-2 max-w-2xl text-muted-foreground">{i.bio}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {i.twitter_handle && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`https://x.com/${i.twitter_handle}`} target="_blank" rel="noopener noreferrer">
                    <XIcon className="h-3.5 w-3.5" /> @{i.twitter_handle}
                  </Link>
                </Button>
              )}
              {i.instagram_handle && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`https://instagram.com/${i.instagram_handle}`} target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-3.5 w-3.5" /> @{i.instagram_handle}
                  </Link>
                </Button>
              )}
              {i.tiktok_handle && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`https://tiktok.com/@${i.tiktok_handle}`} target="_blank" rel="noopener noreferrer">
                    <TikTokIcon className="h-3.5 w-3.5" /> @{i.tiktok_handle}
                  </Link>
                </Button>
              )}
              {i.youtube_handle && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`https://youtube.com/@${i.youtube_handle}`} target="_blank" rel="noopener noreferrer">
                    <Youtube className="h-3.5 w-3.5" /> @{i.youtube_handle}
                  </Link>
                </Button>
              )}
              {i.website_url && (
                <Button asChild variant="outline" size="sm">
                  <Link href={i.website_url} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-3.5 w-3.5" /> Sitio
                  </Link>
                </Button>
              )}
            </div>
          </div>
          <Button asChild size="lg">
            <Link href={`/donar?to=${i.slug}`}>
              Donar <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>

        {/* Stats */}
        <section className="mt-8 grid gap-3 md:grid-cols-3">
          <Stat label="Recibido" value={formatUsd(recibido)} icon={<Wallet className="h-5 w-5" />} />
          <Stat
            label="Entregado (verificado)"
            value={formatUsd(entregado)}
            hint={`${pct}% del recibido · conciliado con factura`}
            icon={<ShieldCheck className="h-5 w-5" />}
          />
          <Stat
            label="Pendiente de verificar"
            value={formatUsd(pendienteVerif)}
            hint="rendiciones subidas pero sin validar todavía"
            icon={<ReceiptText className="h-5 w-5" />}
          />
        </section>

        {/* Progress bar */}
        <Card className="mt-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progreso de entrega verificada</span>
              <span className="font-mono tabular-nums">{pct}%</span>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Solo se cuenta como <strong className="text-foreground">entregado</strong>{' '}
              lo que está conciliado con factura o comprobante verificado por un
              validador autorizado. Lo subido sin verificar aparece arriba como
              pendiente.
            </p>
          </CardContent>
        </Card>

        {/* Rendiciones verificadas */}
        <section className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Rendiciones verificadas</CardTitle>
              <CardDescription>
                Cada línea es un gasto con factura validada. Las no verificadas
                no aparecen aquí.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {rendiciones.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  Todavía no hay rendiciones verificadas. Cuando las haya, cada
                  factura aparecerá listada con su validador.
                </p>
              ) : (
                rendiciones.map((r: any) => (
                  <div
                    key={r.id}
                    className="grid gap-2 p-4 md:grid-cols-[1fr_auto_auto] md:items-center md:gap-6"
                  >
                    <div>
                      <p className="font-medium">{r.concepto}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {destinoLabel[r.destino_tipo] ?? r.destino_tipo}
                        {r.verificado_por ? ` · validado por ${r.verificado_por}` : ''}
                        {r.verificado_at ? ` · ${relativeTime(r.verificado_at)}` : ''}
                      </p>
                    </div>
                    <p className="font-mono text-sm">{formatUsd(Number(r.monto_usd ?? 0))}</p>
                    <Badge variant="success">Verificada</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
