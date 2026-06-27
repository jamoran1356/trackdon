import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { Stat } from '@/components/ui/stat';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockInfluencerRendiciones } from '@/lib/mock';
import { formatUsd } from '@/lib/utils';
import { Megaphone, Wallet, ShieldCheck, Plus, ReceiptText } from 'lucide-react';

export const metadata = { title: 'Influencer' };

const ALLOWED = new Set(['influencer', 'super_admin']);

const destinoLabel: Record<string, string> = {
  compra_insumos: 'Compra de insumos',
  transferencia_centro: 'Transferencia a centro',
  entrega_directa: 'Entrega directa',
  otro: 'Otro'
};

export default async function InfluencerDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!ALLOWED.has(user.rol)) redirect('/dashboard');

  const recibido = 23_820;
  const rendido = mockInfluencerRendiciones
    .filter((r) => r.estado === 'verificado')
    .reduce((s, r) => s + r.monto, 0);
  const pendiente = recibido - rendido;
  const pct = recibido ? Math.round((rendido / recibido) * 100) : 0;

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-start md:justify-between">
        <div>
          <Badge variant="outline" className="mb-2">Dashboard · influencer</Badge>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">@anonimo1</h1>
          <p className="text-sm text-muted-foreground">Cuenta verificada · validador: Cruz Roja</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline">
            <ReceiptText className="h-4 w-4" /> Ver rendiciones
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4" /> Rendir
          </Button>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <Stat label="Recibido" value={formatUsd(recibido)} icon={<Wallet className="h-5 w-5" />} />
        <Stat label="Rendido" value={formatUsd(rendido)} hint={`${pct}% del recibido`} icon={<ShieldCheck className="h-5 w-5" />} />
        <Stat label="Pendiente de rendir" value={formatUsd(pendiente)} icon={<Megaphone className="h-5 w-5" />} />
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Progreso de rendición</CardTitle>
          <CardDescription>
            Cuando rindes 100% del recibido, tu cuenta gana el badge{' '}
            <Badge variant="success" className="align-middle">al día</Badge>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>{pct}%</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Rendiciones</CardTitle>
          <CardDescription>Cada salida con su comprobante y verificación.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {mockInfluencerRendiciones.map((r) => (
            <div key={r.id} className="grid gap-2 p-4 md:grid-cols-[1fr_auto_auto] md:items-center md:gap-6">
              <div>
                <p className="font-medium">{r.concepto}</p>
                <p className="mt-1 text-xs text-muted-foreground">{destinoLabel[r.destino]} · hace {r.creado}</p>
              </div>
              <p className="font-mono text-sm">{formatUsd(r.monto)}</p>
              <Badge variant={r.estado === 'verificado' ? 'success' : 'warning'}>
                {r.estado === 'verificado' ? 'Verificado' : 'Pendiente'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
