import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getMyCentros, getCentroRollup } from '@/lib/supabase/dashboard-queries';
import { Stat } from '@/components/ui/stat';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatUsd } from '@/lib/utils';
import { Box, HeartHandshake, ArrowDownToLine, MapPin } from 'lucide-react';

export const metadata = { title: 'Dashboard centro' };

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.max(1, Math.floor(ms / 60_000));
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

const estadoBadge: Record<string, { label: string; v: 'default' | 'success' | 'warning' | 'info' }> = {
  pendiente: { label: 'Pendiente', v: 'warning' },
  recibida: { label: 'Recibida', v: 'info' },
  en_transito: { label: 'En tránsito', v: 'default' },
  distribuida: { label: 'Distribuida', v: 'success' }
};

export default async function CentroDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?return_to=/dashboard/centro');

  const centros = await getMyCentros(user.id);

  if (centros.length === 0) {
    return (
      <>
        <div className="mb-6">
          <Badge variant="outline" className="mb-2">Dashboard · centro de acopio</Badge>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">No estás vinculado a ningún centro</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Box className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-4 font-medium">Pide a un admin que te asigne como responsable</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Solo los responsables registrados de un centro pueden verlo desde aquí.
              Si tu centro aún no existe, un admin puede crearlo y vincularte.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  const c = centros[0];
  const roll = await getCentroRollup(c.id);
  const totalUsd = (roll.donaciones ?? []).reduce((s: number, d: any) => s + Number(d.valor_estimado_usd ?? 0), 0);

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-start md:justify-between">
        <div>
          <Badge variant="outline" className="mb-2">Dashboard · centro de acopio</Badge>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{c.nombre}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> {c.direccion ?? 'Sin dirección'}
          </p>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <Stat label="Donaciones recibidas" value={String(roll.donaciones.length)} icon={<HeartHandshake className="h-5 w-5" />} />
        <Stat label="Valor estimado total" value={formatUsd(totalUsd)} icon={<Box className="h-5 w-5" />} />
        <Stat label="Custodias firmadas" value={String(roll.custodias.length)} icon={<ArrowDownToLine className="h-5 w-5" />} />
      </section>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Últimas donaciones recibidas</CardTitle>
          <CardDescription>Las últimas 10.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {roll.donaciones.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No hay donaciones registradas todavía para este centro.</p>
          ) : (
            roll.donaciones.map((d: any) => {
              const e = estadoBadge[d.estado] ?? { label: d.estado, v: 'default' as const };
              return (
                <div key={d.id} className="grid gap-2 p-4 md:grid-cols-[1fr_auto_auto] md:items-center md:gap-6">
                  <div>
                    <p className="font-medium">{d.descripcion ?? 'Donación'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {(d.donante?.nombre_mostrado ?? 'Anónimo')} · {relativeTime(d.creado_at)}
                    </p>
                  </div>
                  <p className="font-mono text-sm">{formatUsd(Number(d.valor_estimado_usd ?? 0))}</p>
                  <Badge variant={e.v}>{e.label}</Badge>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </>
  );
}
