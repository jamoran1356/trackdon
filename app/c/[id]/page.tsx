import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Warehouse, Package, Truck, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createSupabaseAdmin();
  const { data } = await admin.from('centros_acopio').select('nombre').eq('id', id).maybeSingle();
  return { title: data?.nombre ?? 'Centro de acopio' };
}

export default async function CentroPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createSupabaseAdmin();

  const { data: centro } = await admin
    .from('centros_acopio')
    .select('id, nombre, tipo, direccion, email_contacto, activo, evento_id')
    .eq('id', id)
    .maybeSingle();
  if (!centro) notFound();

  const [
    { data: cajas },
    { count: voluntariosTotal },
    { count: camionesTotal }
  ] = await Promise.all([
    admin.from('cajas')
      .select('id, codigo, titulo, estado, creado_at')
      .eq('centro_destino_id', id)
      .neq('estado', 'borrador')
      .order('creado_at', { ascending: false })
      .limit(50),
    admin.from('centro_personal').select('id', { count: 'exact', head: true })
      .eq('centro_id', id).eq('activo', true),
    admin.from('centros_camiones').select('id', { count: 'exact', head: true })
      .eq('centro_id', id)
  ]);

  type CajaRow = { id: string; codigo: string; titulo: string | null; estado: string; creado_at: string };
  const cajasRows = (cajas ?? []) as CajaRow[];

  const stats = {
    cajasTotal: cajasRows.length,
    recibidas: cajasRows.filter((c) => ['recibida','en_camion','en_via'].includes(c.estado)).length,
    distribuidas: cajasRows.filter((c) => c.estado === 'distribuida').length
  };

  return (
    <>
      <SiteHeader />
      <main className="container py-8 md:py-12 space-y-6">
        <div>
          <Badge variant="outline">Centro de acopio</Badge>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{centro.nombre}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {centro.tipo}{centro.direccion ? ` · ${centro.direccion}` : ''}
            {!centro.activo && ' · Inactivo'}
          </p>
          {centro.email_contacto && (
            <p className="mt-1 text-sm">
              Contacto: <a href={`mailto:${centro.email_contacto}`} className="text-primary hover:underline">{centro.email_contacto}</a>
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Cajas recibidas" value={stats.cajasTotal} icon={Package} />
          <StatTile label="En tránsito" value={stats.recibidas} icon={Truck} />
          <StatTile label="Distribuidas" value={stats.distribuidas} icon={Warehouse} />
          <StatTile label="Personal · vehículos" value={`${voluntariosTotal ?? 0} · ${camionesTotal ?? 0}`} icon={Users} />
        </div>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3 text-base font-semibold">Cajas asociadas ({cajasRows.length})</h2>
            {cajasRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin cajas registradas.</p>
            ) : (
              <div className="grid gap-2">
                {cajasRows.map((c) => (
                  <Link key={c.id} href={`/box/${c.codigo}`}>
                    <div className="flex items-center gap-3 rounded-md border border-border/60 p-3 hover:bg-accent">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{c.titulo ?? 'Sin título'}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-mono">{c.codigo}</span> · {c.estado}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(c.creado_at).toLocaleDateString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}

function StatTile({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="p-5">
        <Icon className="h-5 w-5 text-primary" />
        <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
