import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { getSessionUser } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { RegistroCentroForm } from './form';

export const metadata = {
  title: 'Registra tu centro de acopio',
  description: 'Onboarding de organizaciones receptoras en trackdon.'
};

export const dynamic = 'force-dynamic';

export default async function RegistroCentroPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login?return_to=/registro-centro');
  }

  const admin = createSupabaseAdmin();
  const { data: existing } = await admin
    .from('responsables')
    .select('centro_id')
    .eq('usuario_auth_id', user.id)
    .limit(1)
    .maybeSingle();

  const { data: eventos } = await admin
    .from('eventos')
    .select('id, nombre, slug')
    .eq('activo', true)
    .order('creado_at', { ascending: false });

  return (
    <>
      <SiteHeader />
      <main className="container max-w-2xl py-8 md:py-14">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Registra tu centro de acopio</h1>
        <p className="mt-3 text-muted-foreground">
          Si recibís donaciones humanitarias (en bienes o en cash), regístrate acá para que aparezcan en el libro
          público y los donantes puedan ver el rastro completo de lo que entregan.
        </p>

        {existing ? (
          <div className="mt-6 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
            Ya estás registrado como responsable de un centro. Ve a tu panel en <strong>/dashboard/centro</strong>.
          </div>
        ) : (
          <div className="mt-8">
            <RegistroCentroForm eventos={(eventos ?? []) as { id: string; nombre: string; slug: string }[]} />
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
