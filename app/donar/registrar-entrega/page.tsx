import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSessionUser } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase/server';
import { RegistrarEntregaForm } from './form';

export const metadata = { title: 'Registrar entrega' };

export default async function RegistrarEntregaPage() {
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
                Para registrar tu entrega necesitamos asociarla a tu cuenta —
                así puedes seguir el rastro y figurar como donante. Toma 30 segundos.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/registro?return_to=/donar/registrar-entrega">Crear cuenta</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login?return_to=/donar/registrar-entrega">Ya tengo cuenta</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </>
    );
  }

  const supabase = await createSupabaseServer();
  const [eventosRes, centrosRes] = await Promise.all([
    supabase
      .from('eventos')
      .select('id, slug, nombre')
      .eq('activo', true)
      .order('fecha_inicio', { ascending: false, nullsFirst: false }),
    supabase
      .from('centros_acopio')
      .select('id, nombre, tipo, evento_id, direccion')
      .eq('activo', true)
  ]);

  const eventos = eventosRes.data ?? [];
  const centros = centrosRes.data ?? [];

  return (
    <>
      <SiteHeader />
      <main className="container max-w-2xl py-8 md:py-12">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Registrar tu entrega</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tres pasos: elige el evento, indica a qué centro entregaste (o agrega uno),
          y describe lo que donaste.
        </p>
        <Card className="mt-6">
          <CardContent className="p-6">
            <RegistrarEntregaForm eventos={eventos} centros={centros} />
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
