import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getMyCentroId } from '@/lib/centro';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Boxes } from 'lucide-react';

export const metadata = { title: 'Inventario consolidado' };
export const dynamic = 'force-dynamic';

type Estado = 'sellada' | 'recibida' | 'en_camion' | 'en_via' | 'distribuida';
const ESTADO_LABEL: Record<string, string> = {
  sellada: 'Esperando recibo', recibida: 'En centro',
  en_camion: 'En camión', en_via: 'En vía', distribuida: 'Distribuido'
};

export default async function InventarioPage({
  searchParams
}: { searchParams: Promise<{ estado?: string }> }) {
  const { estado: estadoFiltro } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!['centro_admin','centro_responsable','super_admin'].includes(user.rol)) redirect('/dashboard');

  const centroId = await getMyCentroId();
  if (!centroId && user.rol !== 'super_admin') {
    return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Sin centro asignado.</CardContent></Card>;
  }

  const admin = createSupabaseAdmin();

  // Cajas del centro (no borradores)
  let cajasQuery = admin
    .from('cajas')
    .select('id, codigo, estado')
    .eq('centro_destino_id', centroId!)
    .neq('estado', 'borrador');

  if (estadoFiltro && estadoFiltro !== 'todos') {
    cajasQuery = cajasQuery.eq('estado', estadoFiltro);
  }
  const { data: cajas } = await cajasQuery;
  const cajaIds = ((cajas ?? []) as { id: string }[]).map((c) => c.id);

  let items: { descripcion: string; cantidad: number; unidad: string; subcategoria: string | null; caja_id: string }[] = [];
  if (cajaIds.length > 0) {
    const { data: itemsData } = await admin
      .from('caja_items')
      .select('descripcion, cantidad, unidad, subcategoria, caja_id')
      .in('caja_id', cajaIds);
    items = (itemsData ?? []) as typeof items;
  }

  // Agregar por (descripcion + unidad + subcategoria)
  const agregado = new Map<string, { descripcion: string; unidad: string; subcategoria: string | null; total: number; cajasCount: Set<string> }>();
  for (const it of items) {
    const key = `${it.descripcion.toLowerCase()}__${it.unidad.toLowerCase()}__${(it.subcategoria ?? '').toLowerCase()}`;
    const ex = agregado.get(key);
    if (ex) {
      ex.total += Number(it.cantidad);
      ex.cajasCount.add(it.caja_id);
    } else {
      agregado.set(key, {
        descripcion: it.descripcion,
        unidad: it.unidad,
        subcategoria: it.subcategoria,
        total: Number(it.cantidad),
        cajasCount: new Set([it.caja_id])
      });
    }
  }
  const filas = Array.from(agregado.values()).sort((a, b) => b.total - a.total);
  const totalItems = filas.reduce((s, f) => s + f.total, 0);

  const filtros: { value: string; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'recibida', label: 'En centro' },
    { value: 'en_camion', label: 'En camión' },
    { value: 'en_via', label: 'En vía' },
    { value: 'distribuida', label: 'Distribuidos' }
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Inventario consolidado</h1>
        <p className="text-sm text-muted-foreground">
          Suma de items de todas las cajas asignadas al centro. {totalItems.toLocaleString()} items totales en {filas.length} líneas.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filtros.map((f) => (
          <Link
            key={f.value}
            href={f.value === 'todos' ? '/dashboard/centro/inventario' : `/dashboard/centro/inventario?estado=${f.value}`}
            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium ${
              (estadoFiltro ?? 'todos') === f.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input hover:bg-accent'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {filas.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          Sin items para este filtro.
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {filas.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Package className="h-4 w-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {f.total} {f.unidad}{f.total > 1 && f.unidad === 'unidad' ? 'es' : ''} · {f.descripcion}
                    {f.subcategoria && <span className="text-muted-foreground"> ({f.subcategoria})</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    De {f.cajasCount.size} {f.cajasCount.size === 1 ? 'caja' : 'cajas'}
                  </p>
                </div>
                <Boxes className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
