import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { getSessionUser } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { RegistroCentroForm } from './form';

export const metadata = {
  title: 'Registra tu centro de acopio',
  description: 'Onboarding unificado de organizaciones receptoras en trackdon.'
};

export const dynamic = 'force-dynamic';

export default async function RegistroCentroPage() {
  const user = await getSessionUser();

  const admin = createSupabaseAdmin();
  const { data: eventos } = await admin
    .from('eventos').select('id, nombre, slug').eq('activo', true).order('creado_at', { ascending: false });

  return (
    <>
      <SiteHeader />
      <main className="container max-w-3xl py-8 md:py-14">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Registra tu centro de acopio</h1>
        <p className="mt-3 text-muted-foreground">
          Onboarding en un paso: creamos la cuenta del administrador y registramos el centro en el libro público.
          Si recibes donaciones humanitarias (en bienes o en cash), aquí queda el rastro completo de lo que entra y sale.
        </p>

        <div className="mt-8">
          <RegistroCentroForm
            userLogged={!!user}
            userEmail={user?.email ?? null}
            eventos={(eventos ?? []) as { id: string; nombre: string; slug: string }[]}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
