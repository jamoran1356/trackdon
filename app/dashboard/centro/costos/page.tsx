import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getMyCentroId } from '@/lib/centro';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Plus } from 'lucide-react';
import { AddCostoForm, CostoRow } from './components';

export const metadata = { title: 'Costos del centro' };
export const dynamic = 'force-dynamic';

export default async function CostosPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!['centro_admin','centro_responsable','super_admin'].includes(user.rol)) redirect('/dashboard');

  const centroId = await getMyCentroId();
  if (!centroId && user.rol !== 'super_admin') {
    return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Sin centro asignado.</CardContent></Card>;
  }

  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from('centros_costos')
    .select('id, categoria, descripcion, monto_usd, fecha')
    .eq('centro_id', centroId!)
    .order('fecha', { ascending: false })
    .limit(100);
  type Costo = { id: string; categoria: string; descripcion: string | null; monto_usd: number; fecha: string };
  const rows = (data ?? []) as Costo[];
  const total = rows.reduce((s, c) => s + Number(c.monto_usd), 0);

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Costos operativos</h1>
          <p className="text-sm text-muted-foreground">Gastos del centro: combustible, mantenimiento, logística, etc.</p>
        </div>
        <p className="text-sm">Total registrado: <strong>${total.toLocaleString()}</strong></p>
      </div>
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Plus className="h-4 w-4" /> Agregar costo
          </h2>
          <AddCostoForm centroId={centroId!} />
        </CardContent>
      </Card>
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
        <DollarSign className="h-4 w-4" /> Movimientos ({rows.length})
      </h2>
      {rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Sin costos cargados.</CardContent></Card>
      ) : (
        <div className="grid gap-2">{rows.map((c) => <CostoRow key={c.id} costo={c} />)}</div>
      )}
    </>
  );
}
