import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getMyInfluencer, getInfluencerRollup } from '@/lib/supabase/dashboard-queries';
import { Stat } from '@/components/ui/stat';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatUsd } from '@/lib/utils';
import { Megaphone, Wallet, ShieldCheck, Plus, ReceiptText, AlertTriangle, BadgeCheck, ExternalLink } from 'lucide-react';

export const metadata = { title: 'Dashboard influencer' };

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

export default async function InfluencerDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?return_to=/dashboard/influencer');

  const inf = await getMyInfluencer(user.id);

  // Si no tiene perfil influencer aún, ofrecer crearlo
  if (!inf) {
    return (
      <>
        <div className="mb-6">
          <Badge variant="outline" className="mb-2">Dashboard · influencer</Badge>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Aún no tienes perfil de influencer</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Megaphone className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-4 font-medium">Crea tu perfil para recibir donaciones</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Luego un validador autorizado lo revisa y, si todo está en regla,
              te marca como verificado.
            </p>
            <Button asChild className="mt-6">
              <Link href="/influencers/nuevo">
                <Plus className="h-4 w-4" /> Crear perfil de influencer
              </Link>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const roll = await getInfluencerRollup(inf.id);
  const pct = roll.recibido ? Math.round((roll.entregado / roll.recibido) * 100) : 0;
  const isVerified = !!inf.verificado_at;
  const isRejected = !!inf.rechazado_at && !isVerified;

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Dashboard · influencer</Badge>
            {isVerified ? (
              <Badge variant="success" className="gap-1"><BadgeCheck className="h-3 w-3" /> Verificado</Badge>
            ) : isRejected ? (
              <Badge variant="warning">Rechazado</Badge>
            ) : (
              <Badge variant="warning">Pendiente de verificar</Badge>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{inf.nombre_publico}</h1>
          {inf.slug && (
            <Link href={`/i/${inf.slug}`} className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              ver perfil público <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/influencer/rendiciones">
              <ReceiptText className="h-4 w-4" /> Mis rendiciones
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/influencer/rendiciones/nueva">
              <Plus className="h-4 w-4" /> Nueva rendición
            </Link>
          </Button>
        </div>
      </div>

      {isRejected && inf.rechazado_motivo && (
        <Card className="mb-6 border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium">El validador rechazó tu perfil</p>
                <p className="mt-1 text-sm text-muted-foreground">{inf.rechazado_motivo}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isVerified && !isRejected && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="p-5 text-sm">
            <p className="font-medium">Estás visible públicamente como <em>no verificado</em>.</p>
            <p className="mt-1 text-muted-foreground">
              Un validador autorizado revisa tu perfil pronto. Mientras tanto puedes recibir donaciones y subir rendiciones — solo las verificadas cuentan como entregado.
            </p>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-3 md:grid-cols-3">
        <Stat label="Recibido" value={formatUsd(roll.recibido)} icon={<Wallet className="h-5 w-5" />} />
        <Stat label="Entregado (verificado)" value={formatUsd(roll.entregado)} hint={`${pct}% del recibido`} icon={<ShieldCheck className="h-5 w-5" />} />
        <Stat label="Pendiente de verificar" value={formatUsd(roll.pendiente_verif)} icon={<Megaphone className="h-5 w-5" />} />
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Progreso de rendición verificada</CardTitle>
          <CardDescription>Solo cuenta como entregado lo que está conciliado con factura.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>0</span><span>{pct}%</span><span>100%</span>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Tus rendiciones</CardTitle>
          <CardDescription>Últimas 20.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {roll.rendiciones.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Sin rendiciones todavía. Pulsa <strong>Nueva rendición</strong> arriba para subir tu primer gasto.
            </p>
          ) : (
            roll.rendiciones.map((r: any) => (
              <div key={r.id} className="grid gap-2 p-4 md:grid-cols-[1fr_auto_auto] md:items-center md:gap-6">
                <div>
                  <p className="font-medium">{r.concepto}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {destinoLabel[r.destino_tipo] ?? r.destino_tipo} · {relativeTime(r.creado_at)}
                  </p>
                </div>
                <p className="font-mono text-sm">{formatUsd(Number(r.monto_usd ?? 0))}</p>
                {r.verificado_at ? (
                  <Badge variant="success">Verificada</Badge>
                ) : r.rechazado_at ? (
                  <Badge variant="warning">Rechazada</Badge>
                ) : (
                  <Badge variant="info">Pendiente</Badge>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
