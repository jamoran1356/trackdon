import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getMyCentroId } from '@/lib/centro';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Plus } from 'lucide-react';
import { AddPuntoForm, PuntoRow } from './components';

export const metadata = { title: 'Puntos de recepción' };
export const dynamic = 'force-dynamic';

export default async function PuntosPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!['centro_admin','centro_responsable','super_admin'].includes(user.rol)) redirect('/dashboard');

  const centroId = await getMyCentroId();
  if (!centroId && user.rol !== 'super_admin') {
    return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Sin centro asignado.</CardContent></Card>;
  }

  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from('centros_puntos_recepcion')
    .select('id, nombre, direccion, horario, capacidad_estimada, activo')
    .eq('centro_id', centroId!)
    .order('creado_at', { ascending: false });
  type Punto = { id: string; nombre: string; direccion: string | null; horario: string | null; capacidad_estimada: string | null; activo: boolean };
  const rows = (data ?? []) as Punto[];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Puntos de recepción</h1>
        <p className="text-sm text-muted-foreground">Ubicaciones físicas adicionales donde tu centro recibe donaciones.</p>
      </div>
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Plus className="h-4 w-4" /> Agregar punto
          </h2>
          <AddPuntoForm centroId={centroId!} />
        </CardContent>
      </Card>
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
        <MapPin className="h-4 w-4" /> Puntos ({rows.length})
      </h2>
      {rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Sin puntos cargados.</CardContent></Card>
      ) : (
        <div className="grid gap-2">{rows.map((p) => <PuntoRow key={p.id} punto={p} />)}</div>
      )}
    </>
  );
}
