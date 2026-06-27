import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSessionUser } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase/server';
import { NuevoInfluencerForm } from './form';

export const metadata = { title: 'Crear perfil de influencer' };

export default async function NuevoInfluencerPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <>
        <SiteHeader />
        <main className="container max-w-md py-10 md:py-16">
          <Card>
            <CardHeader>
              <CardTitle>Antes, regístrate</CardTitle>
              <CardDescription>
                Para crear tu perfil de influencer necesitas tener cuenta primero.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/registro?return_to=/influencers/nuevo">Crear cuenta</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login?return_to=/influencers/nuevo">Ya tengo cuenta</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </>
    );
  }

  const supabase = await createSupabaseServer();
  const { data: eventos } = await supabase
    .from('eventos')
    .select('id, slug, nombre')
    .eq('activo', true)
    .order('fecha_inicio', { ascending: false, nullsFirst: false });

  return (
    <>
      <SiteHeader />
      <main className="container max-w-2xl py-8 md:py-12">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Crea tu perfil de influencer</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Una vez creado, un validador autorizado lo revisa. Mientras tanto puedes
          recibir donaciones y subir rendiciones — solo las verificadas cuentan
          como entregado.
        </p>
        <Card className="mt-6">
          <CardContent className="p-6">
            <NuevoInfluencerForm eventos={eventos ?? []} />
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
