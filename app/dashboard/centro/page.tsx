import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getMyCentroId } from '@/lib/centro';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package, Truck, CheckCircle2, Users, Warehouse, MapPin,
  DollarSign, Calendar, Boxes, ArrowRight
} from 'lucide-react';

export const metadata = { title: 'Mi centro — dashboard' };
export const dynamic = 'force-dynamic';

const COSTO_LABEL: Record<string, string> = {
  combustible: 'Combustible',
  mantenimiento_vehiculo: 'Mantenimiento',
  mano_de_obra: 'Mano de obra',
  alquiler: 'Alquiler',
  servicios: 'Servicios',
  logistica: 'Logística',
  empaque: 'Empaque',
  otros: 'Otros'
};

const ESTADO_TONE: Record<string, string> = {
  recibida: 'bg-amber-500',
  en_camion: 'bg-blue-500',
  en_via: 'bg-indigo-500',
  distribuida: 'bg-primary'
};

export default async function CentroDashboardHome() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!['centro_admin','centro_responsable','super_admin'].includes(user.rol)) redirect('/dashboard');

  const centroId = await getMyCentroId();
  if (!centroId && user.rol !== 'super_admin') {
    return (
      <Card><CardContent className="p-8 text-center">
        <Warehouse className="mx-auto h-10 w-10 text-primary" />
        <p className="mt-3 font-medium">No estás vinculado a ningún centro</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Si todavía no registraste el centro, puedes hacerlo en{' '}
          <Link href="/registro-centro" className="text-primary hover:underline">/registro-centro</Link>.
        </p>
      </CardContent></Card>
    );
  }

  const admin = createSupabaseAdmin();
  const [
    { data: centro },
    { data: stats },
    { data: cajasPorEstado },
    { data: costosPorCategoria },
    { data: cajasRecientes }
  ] = await Promise.all([
    admin.from('centros_acopio')
      .select('id, nombre, tipo, direccion, email_contacto, activo')
      .eq('id', centroId!).maybeSingle(),
    admin.from('v_centro_stats').select('*').eq('centro_id', centroId!).maybeSingle(),
    admin.from('cajas').select('estado').eq('centro_destino_id', centroId!).neq('estado', 'borrador'),
    admin.from('centros_costos').select('categoria, monto_usd').eq('centro_id', centroId!),
    admin.from('cajas')
      .select('id, codigo, titulo, estado, creado_at')
      .eq('centro_destino_id', centroId!).neq('estado', 'borrador')
      .order('creado_at', { ascending: false }).limit(8)
  ]);

  type StatsRow = {
    cajas_recibidas: number; cajas_en_transito: number; cajas_distribuidas: number;
    personal_activo: number; vehiculos_total: number; puntos_recepcion: number;
    costo_total_usd: number; costo_mes_actual_usd: number;
  };
  const s = (stats ?? {}) as Partial<StatsRow>;

  // Agrupar cajas por estado
  const estadoBuckets = ['recibida','en_camion','en_via','distribuida'] as const;
  type EstadoBucket = typeof estadoBuckets[number];
  const counts: Record<EstadoBucket, number> = { recibida: 0, en_camion: 0, en_via: 0, distribuida: 0 };
  for (const c of (cajasPorEstado ?? []) as { estado: EstadoBucket }[]) {
    if (c.estado in counts) counts[c.estado]++;
  }
  const maxEstado = Math.max(1, ...Object.values(counts));

  // Agrupar costos por categoría
  const costoBuckets: Record<string, number> = {};
  for (const c of (costosPorCategoria ?? []) as { categoria: string; monto_usd: number }[]) {
    costoBuckets[c.categoria] = (costoBuckets[c.categoria] ?? 0) + Number(c.monto_usd);
  }
  const costoEntries = Object.entries(costoBuckets).sort((a, b) => b[1] - a[1]);
  const maxCosto = Math.max(1, ...costoEntries.map((e) => e[1]));

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <Badge variant="outline" className="mb-2">Dashboard · centro de acopio</Badge>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{centro?.nombre}</h1>
          {centro?.direccion && (
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {centro.direccion}
            </p>
          )}
        </div>
        <Button asChild variant="outline">
          <Link href={`/c/${centroId}`} target="_blank">Ver perfil público <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>

      {/* Stats tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Recibidas" value={s.cajas_recibidas ?? 0} icon={Package} tone="bg-amber-500/10 text-amber-600" />
        <Tile label="En tránsito" value={s.cajas_en_transito ?? 0} icon={Truck} tone="bg-blue-500/10 text-blue-600" />
        <Tile label="Distribuidas" value={s.cajas_distribuidas ?? 0} icon={CheckCircle2} tone="bg-primary/10 text-primary" />
        <Tile label="Personal · vehículos · puntos" value={`${s.personal_activo ?? 0} · ${s.vehiculos_total ?? 0} · ${s.puntos_recepcion ?? 0}`} icon={Users} tone="bg-slate-500/10 text-slate-600" />
      </div>

      {/* Gráficas */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-1 text-base font-semibold">Cajas por estado</h2>
            <p className="mb-4 text-xs text-muted-foreground">Resumen del flujo logístico actual.</p>
            <div className="space-y-3">
              {estadoBuckets.map((e) => {
                const n = counts[e];
                const pct = (n / maxEstado) * 100;
                return (
                  <div key={e}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="capitalize">{e.replace('_',' ')}</span>
                      <span className="font-medium">{n}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className={`h-full ${ESTADO_TONE[e]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-base font-semibold">Costos por categoría</h2>
              <span className="text-xs text-muted-foreground">
                Mes: ${(s.costo_mes_actual_usd ?? 0).toLocaleString()} · Total: ${(s.costo_total_usd ?? 0).toLocaleString()}
              </span>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">Suma histórica USD.</p>
            {costoEntries.length === 0 ? (
              <p className="rounded-md border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                Sin costos cargados.{' '}
                <Link href="/dashboard/centro/costos" className="text-primary hover:underline">Agregar el primero</Link>
              </p>
            ) : (
              <div className="space-y-3">
                {costoEntries.map(([cat, monto]) => {
                  const pct = (monto / maxCosto) * 100;
                  return (
                    <div key={cat}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span>{COSTO_LABEL[cat] ?? cat}</span>
                        <span className="font-medium">${monto.toLocaleString()}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink href="/dashboard/centro/cajas" icon={Package} title="Cajas recibidas" desc="Ver inventario y trayecto" />
        <QuickLink href="/dashboard/centro/personal" icon={Users} title="Personal" desc="Voluntarios y empleados" />
        <QuickLink href="/dashboard/centro/vehiculos" icon={Truck} title="Vehículos" desc="Flota y disponibilidad" />
        <QuickLink href="/dashboard/centro/puntos" icon={MapPin} title="Puntos de recepción" desc="Ubicaciones físicas" />
        <QuickLink href="/dashboard/centro/inventario" icon={Boxes} title="Inventario" desc="Items consolidados" />
        <QuickLink href="/dashboard/centro/costos" icon={DollarSign} title="Costos" desc="Gastos operativos" />
        <QuickLink href="/dashboard/centro/asignaciones" icon={Calendar} title="Asignaciones" desc="Persona ↔ vehículo" />
      </div>

      {/* Cajas recientes */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Últimas cajas</h2>
            <Link href="/dashboard/centro/cajas" className="text-xs text-primary hover:underline">Ver todas</Link>
          </div>
          {(cajasRecientes ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no recibes cajas.</p>
          ) : (
            <div className="space-y-2">
              {((cajasRecientes ?? []) as { id: string; codigo: string; titulo: string | null; estado: string; creado_at: string }[]).map((c) => (
                <Link key={c.id} href={`/dashboard/centro/cajas/${c.id}`}>
                  <div className="flex items-center gap-3 rounded-md border border-border/60 p-3 hover:bg-accent">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{c.titulo ?? 'Sin título'}</p>
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
    </>
  );
}

function Tile({ label, value, icon: Icon, tone }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }>; tone: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <span className={`grid h-10 w-10 place-items-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
        <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function QuickLink({ href, icon: Icon, title, desc }: { href: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:bg-accent">
        <CardContent className="flex items-start gap-3 p-5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
