import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { Stat } from '@/components/ui/stat';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockCentroInventario, mockDonacionesPublicas } from '@/lib/mock';
import { formatNumber } from '@/lib/utils';
import { Box, ArrowDownToLine, ArrowUpFromLine, Plus, Package } from 'lucide-react';

export const metadata = { title: 'Centro de acopio' };

const ALLOWED = new Set(['centro_admin', 'centro_responsable', 'super_admin']);

export default async function CentroDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!ALLOWED.has(user.rol)) redirect('/dashboard');

  const totalItems = mockCentroInventario.reduce((s, x) => s + x.total, 0);
  const ingresados = mockCentroInventario.reduce((s, x) => s + x.ingresados, 0);
  const salidos = mockCentroInventario.reduce((s, x) => s + x.salidos, 0);

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-start md:justify-between">
        <div>
          <Badge variant="outline" className="mb-2">Dashboard · centro de acopio</Badge>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Centro Norte</h1>
          <p className="text-sm text-muted-foreground">Físico · validador: Cruz Roja</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline">
            <ArrowUpFromLine className="h-4 w-4" /> Movimiento
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4" /> Registrar donación
          </Button>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <Stat label="Inventario actual" value={formatNumber(totalItems) + ' items'} icon={<Box className="h-5 w-5" />} />
        <Stat label="Ingresados (hoy)" value={formatNumber(ingresados)} hint="acumulado total" icon={<ArrowDownToLine className="h-5 w-5" />} />
        <Stat label="Salidos (hoy)" value={formatNumber(salidos)} hint="movidos o entregados" icon={<ArrowUpFromLine className="h-5 w-5" />} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Inventario por tipo</CardTitle>
            <CardDescription>Resumen de existencias.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {mockCentroInventario.map((item) => {
              const turnover = item.ingresados ? Math.round((item.salidos / item.ingresados) * 100) : 0;
              return (
                <div key={item.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{item.tipo}</p>
                        <p className="text-xs text-muted-foreground">
                          +{formatNumber(item.ingresados)} entrada · -{formatNumber(item.salidos)} salida
                        </p>
                      </div>
                    </div>
                    <p className="font-mono text-base tabular-nums">{formatNumber(item.total)}</p>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary/80" style={{ width: `${turnover}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas donaciones recibidas</CardTitle>
            <CardDescription>Donde tú firmaste como responsable.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {mockDonacionesPublicas.slice(0, 4).map((d) => (
              <div key={d.id} className="p-4">
                <p className="font-medium text-sm">{d.descripcion}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  de {d.donante} · hace {d.creado}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
