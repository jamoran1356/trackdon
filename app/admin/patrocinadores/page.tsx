import { createSupabaseAdmin } from '@/lib/supabase/server';
import { PatrocinadorForm, PatrocinadorRow } from './components';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = { title: 'Patrocinadores — admin' };
export const dynamic = 'force-dynamic';

type Patrocinador = {
  id: string; empresa: string; logo_url: string; url: string | null;
  orden: number; activo: boolean;
};

export default async function AdminPatrocinadoresPage() {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from('patrocinadores')
    .select('id, empresa, logo_url, url, orden, activo')
    .order('orden', { ascending: true });

  const rows = (data ?? []) as Patrocinador[];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Patrocinadores</h1>
        <p className="text-sm text-muted-foreground">Aparecen en la landing pública. Menor orden = sale primero.</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="mb-4 text-base font-semibold">Agregar patrocinador</h2>
          <PatrocinadorForm />
        </CardContent>
      </Card>

      <h2 className="mb-3 text-base font-semibold">Listado ({rows.length})</h2>
      {rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Aún no hay patrocinadores cargados.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((p) => <PatrocinadorRow key={p.id} patrocinador={p} />)}
        </div>
      )}
    </>
  );
}
