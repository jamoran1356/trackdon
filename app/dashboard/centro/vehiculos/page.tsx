import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getMyCentroId } from '@/lib/centro';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, Plus } from 'lucide-react';
import { AddVehiculoForm, VehiculoRow } from './components';

export const metadata = { title: 'Vehículos del centro' };
export const dynamic = 'force-dynamic';

export default async function VehiculosPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!['centro_admin','centro_responsable','super_admin'].includes(user.rol)) redirect('/dashboard');

  const centroId = await getMyCentroId();
  if (!centroId && user.rol !== 'super_admin') {
    return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Sin centro asignado.</CardContent></Card>;
  }

  const admin = createSupabaseAdmin();
  const { data: vehiculos } = await admin
    .from('centros_camiones')
    .select('id, identificador, marca, modelo, placa, capacidad_kg, estado')
    .eq('centro_id', centroId!)
    .order('creado_at', { ascending: false });

  type Row = { id: string; identificador: string; marca: string | null; modelo: string | null; placa: string | null; capacidad_kg: number | null; estado: string };
  const rows = (vehiculos ?? []) as Row[];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Vehículos</h1>
        <p className="text-sm text-muted-foreground">Camiones y vehículos de transporte del centro.</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Plus className="h-4 w-4" /> Agregar vehículo
          </h2>
          <AddVehiculoForm centroId={centroId!} />
        </CardContent>
      </Card>

      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
        <Truck className="h-4 w-4" /> Flota ({rows.length})
      </h2>
      {rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Sin vehículos.</CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {rows.map((v) => <VehiculoRow key={v.id} vehiculo={v} />)}
        </div>
      )}
    </>
  );
}
