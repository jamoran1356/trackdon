import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getMyCentroId } from '@/lib/centro';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserPlus } from 'lucide-react';
import { AddPersonalForm, PersonalRow } from './components';

export const metadata = { title: 'Personal del centro' };
export const dynamic = 'force-dynamic';

export default async function CentroPersonalPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!['centro_admin','centro_responsable','super_admin'].includes(user.rol)) redirect('/dashboard');

  const centroId = await getMyCentroId();
  if (!centroId && user.rol !== 'super_admin') {
    return (
      <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
        No estás asignado como responsable de ningún centro.
      </CardContent></Card>
    );
  }

  const admin = createSupabaseAdmin();
  const { data: personal } = await admin
    .from('centro_personal')
    .select('id, nombre, cedula, cargo, activo, creado_at')
    .eq('centro_id', centroId!)
    .order('creado_at', { ascending: false });

  type Row = { id: string; nombre: string; cedula: string | null; cargo: string | null; activo: boolean };
  const rows = (personal ?? []) as Row[];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Personal</h1>
        <p className="text-sm text-muted-foreground">Voluntarios y empleados del centro. La cédula es PII y no es pública.</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <UserPlus className="h-4 w-4" /> Agregar persona
          </h2>
          <AddPersonalForm centroId={centroId!} />
        </CardContent>
      </Card>

      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
        <Users className="h-4 w-4" /> Equipo ({rows.length})
      </h2>
      {rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          Sin personal cargado todavía.
        </CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {rows.map((p) => <PersonalRow key={p.id} persona={p} />)}
        </div>
      )}
    </>
  );
}
