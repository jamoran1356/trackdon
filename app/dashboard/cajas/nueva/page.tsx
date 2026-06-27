import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { NuevaCajaForm } from './form';

export const metadata = { title: 'Nueva caja' };
export const dynamic = 'force-dynamic';

export default async function NuevaCajaPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const admin = createSupabaseAdmin();
  const { data: eventos } = await admin
    .from('eventos')
    .select('id, nombre, slug')
    .eq('activo', true)
    .order('creado_at', { ascending: false });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold tracking-tight md:text-3xl">Nueva caja</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Empiezas con un borrador. Después le agregas items adentro y al final la sellas y la asignas a un centro.
      </p>
      <NuevaCajaForm eventos={(eventos ?? []) as { id: string; nombre: string; slug: string }[]} />
    </div>
  );
}
