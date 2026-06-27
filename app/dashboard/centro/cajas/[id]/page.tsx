import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { CentroCajaForm } from './form';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

const estadoLabel: Record<string, string> = {
  sellada: 'Esperando recibo', recibida: 'Recibida',
  en_camion: 'En camión', en_via: 'En vía', distribuida: 'Distribuida'
};

export default async function CentroCajaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const admin = createSupabaseAdmin();

  const { data: caja } = await admin
    .from('cajas')
    .select('id, codigo, titulo, estado, centro_destino_id, receptor_descripcion, creado_at, sellada_at, recibida_at, en_camion_at, en_via_at, distribuida_at')
    .eq('id', id)
    .maybeSingle();
  if (!caja) notFound();

  // Verificar responsabilidad
  let allowed = user.rol === 'super_admin';
  if (!allowed && caja.centro_destino_id) {
    const { data: r } = await admin
      .from('responsables')
      .select('id')
      .eq('centro_id', caja.centro_destino_id)
      .eq('usuario_auth_id', user.id)
      .maybeSingle();
    allowed = !!r;
  }
  if (!allowed) redirect('/dashboard/centro/cajas');

  const [{ data: items }, { data: eventos }] = await Promise.all([
    admin.from('caja_items').select('id, descripcion, cantidad, unidad, subcategoria, notas').eq('caja_id', id).order('creado_at'),
    admin.from('caja_eventos').select('estado_anterior, estado_nuevo, nota, creado_at').eq('caja_id', id).order('creado_at', { ascending: true })
  ]);

  type Item = { id: string; descripcion: string; cantidad: number; unidad: string; subcategoria: string | null; notas: string | null };
  type Evento = { estado_anterior: string | null; estado_nuevo: string; nota: string | null; creado_at: string };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono">{caja.codigo}</Badge>
          <Badge variant={caja.estado === 'distribuida' ? 'default' : 'secondary'}>
            {estadoLabel[caja.estado] ?? caja.estado}
          </Badge>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
          {caja.titulo ?? 'Caja sin título'}
        </h1>
      </div>

      {/* Contenido */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-3 text-base font-semibold">Contenido ({(items ?? []).length})</h2>
          <div className="space-y-2">
            {((items ?? []) as Item[]).map((it) => (
              <div key={it.id} className="rounded-md border border-border/60 p-3 text-sm">
                <p className="font-medium">
                  {it.cantidad} {it.unidad} · {it.descripcion}
                  {it.subcategoria && <span className="text-muted-foreground"> ({it.subcategoria})</span>}
                </p>
                {it.notas && <p className="mt-1 text-xs text-muted-foreground">{it.notas}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cambio de estado */}
      <CentroCajaForm cajaId={caja.id} estado={caja.estado} receptor={caja.receptor_descripcion} />

      {/* Timeline */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-3 text-base font-semibold">Trayecto</h2>
          <ol className="space-y-2">
            {((eventos ?? []) as Evento[]).map((ev, i) => (
              <li key={i} className="flex gap-3 border-l-2 border-primary/40 pl-3">
                <div>
                  <p className="text-sm font-medium">
                    {ev.estado_anterior ? `${ev.estado_anterior} → ${ev.estado_nuevo}` : `creada como ${ev.estado_nuevo}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(ev.creado_at).toLocaleString()}</p>
                  {ev.nota && <p className="mt-1 text-xs">{ev.nota}</p>}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
