import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Truck, CheckCircle2, Plus } from 'lucide-react';

export const metadata = { title: 'Mi panel' };
export const dynamic = 'force-dynamic';

export default async function DashboardHome() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  // Roles especiales: redirigir a sus paneles
  switch (user.rol) {
    case 'centro_admin':
    case 'centro_responsable':
      redirect('/dashboard/centro');
    case 'influencer':
      redirect('/dashboard/influencer');
    case 'validador':
      redirect('/dashboard/validador');
    case 'super_admin':
      redirect('/admin');
  }

  // Donante: stats + cajas
  const admin = createSupabaseAdmin();
  const [borradores, transito, distribuidas, totalItems] = await Promise.all([
    admin.from('cajas').select('id', { count: 'exact', head: true })
      .eq('donante_auth_id', user.id).eq('estado', 'borrador'),
    admin.from('cajas').select('id', { count: 'exact', head: true })
      .eq('donante_auth_id', user.id).in('estado', ['sellada','recibida','en_camion','en_via']),
    admin.from('cajas').select('id', { count: 'exact', head: true })
      .eq('donante_auth_id', user.id).eq('estado', 'distribuida'),
    admin.rpc('count_caja_items_donante', { p_donante: user.id }).then(
      () => ({ count: 0 }),
      () => ({ count: 0 })
    )
  ]);

  // fallback manual al count rpc (no creé la RPC; suma items via query)
  const { data: cajasUser } = await admin.from('cajas').select('id').eq('donante_auth_id', user.id);
  const cajaIds = (cajasUser ?? []).map((c: { id: string }) => c.id);
  let totalItemsCount = 0;
  if (cajaIds.length > 0) {
    const { count } = await admin
      .from('caja_items')
      .select('id', { count: 'exact', head: true })
      .in('caja_id', cajaIds);
    totalItemsCount = count ?? 0;
  }

  const tiles = [
    { label: 'Borradores', value: borradores.count ?? 0, icon: Package, tone: 'bg-amber-500/10 text-amber-600' },
    { label: 'En tránsito', value: transito.count ?? 0, icon: Truck, tone: 'bg-blue-500/10 text-blue-600' },
    { label: 'Distribuidas', value: distribuidas.count ?? 0, icon: CheckCircle2, tone: 'bg-primary/10 text-primary' },
    { label: 'Items registrados', value: totalItemsCount, icon: Package, tone: 'bg-slate-500/10 text-slate-600' }
  ];

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Mi panel</h1>
          <p className="text-sm text-muted-foreground">Hola @{user.username}. Lo que has trackeado hasta ahora.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/cajas/nueva">
              <Plus className="h-4 w-4" /> Nueva caja
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/cajas">Ver todas</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.label}>
              <CardContent className="p-5">
                <span className={`grid h-10 w-10 place-items-center rounded-lg ${t.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{t.label}</p>
                <p className="mt-1 text-3xl font-bold">{t.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardContent className="p-6">
          <h2 className="text-base font-semibold">¿Cómo funcionan las cajas?</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li><strong>Borrador:</strong> crea una caja y agrega los items adentro (curitas, gasas, ropa, etc).</li>
            <li><strong>Asigna centro:</strong> elige el centro de acopio destino. Si no está en trackdon, invítalo.</li>
            <li><strong>Sella:</strong> queda inmutable y entra al libro público.</li>
            <li><strong>El centro</strong> recibe, registra estado (en camión → en vía → distribuida) y al final indica receptor.</li>
          </ol>
        </CardContent>
      </Card>
    </>
  );
}
