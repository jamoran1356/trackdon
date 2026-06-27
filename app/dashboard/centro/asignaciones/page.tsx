import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getMyCentroId } from '@/lib/centro';
import { Card, CardContent } from '@/components/ui/card';
import { AsignarForm, AsignacionRow } from './components';

export const metadata = { title: 'Asignaciones — centro' };
export const dynamic = 'force-dynamic';

export default async function AsignacionesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!['centro_admin','centro_responsable','super_admin'].includes(user.rol)) redirect('/dashboard');

  const centroId = await getMyCentroId();
  if (!centroId && user.rol !== 'super_admin') {
    return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Sin centro asignado.</CardContent></Card>;
  }

  const admin = createSupabaseAdmin();
  const [{ data: personas }, { data: vehiculos }, { data: asignaciones }] = await Promise.all([
    admin.from('centro_personal').select('id, nombre').eq('centro_id', centroId!).eq('activo', true).order('nombre'),
    admin.from('centros_camiones').select('id, identificador').eq('centro_id', centroId!).order('identificador'),
    admin.from('centro_personal_vehiculo')
      .select('id, centro_personal:personal_id(nombre, centro_id), centros_camiones:vehiculo_id(identificador)')
      .eq('activo', true)
  ]);

  type Asig = {
    id: string;
    centro_personal: { nombre: string; centro_id: string } | null;
    centros_camiones: { identificador: string } | null;
  };
  const filtradas = ((asignaciones ?? []) as Asig[]).filter((a) => a.centro_personal?.centro_id === centroId);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Asignaciones</h1>
        <p className="text-sm text-muted-foreground">Vincular personal con vehículos.</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="mb-4 text-base font-semibold">Nueva asignación</h2>
          <AsignarForm
            personas={(personas ?? []) as { id: string; nombre: string }[]}
            vehiculos={(vehiculos ?? []) as { id: string; identificador: string }[]}
          />
        </CardContent>
      </Card>

      <h2 className="mb-3 text-base font-semibold">Activas ({filtradas.length})</h2>
      {filtradas.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Sin asignaciones.</CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {filtradas.map((a) => (
            <AsignacionRow
              key={a.id}
              asignacion={{
                id: a.id,
                persona: a.centro_personal?.nombre ?? '—',
                vehiculo: a.centros_camiones?.identificador ?? '—'
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
