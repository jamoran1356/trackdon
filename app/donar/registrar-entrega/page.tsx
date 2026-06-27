import Link from 'next/link';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSessionUser } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase/server';
import { RegistrarEntregaForm } from './form';

export const metadata = { title: 'Registrar entrega' };

type Tipo = 'bienes' | 'transferencia';
interface Search { searchParams: Promise<{ tipo?: string }> }

export default async function RegistrarEntregaPage({ searchParams }: Search) {
  const { tipo: rawTipo } = await searchParams;
  const tipo: Tipo = rawTipo === 'transferencia' ? 'transferencia' : 'bienes';

  const user = await getSessionUser();
  if (!user) {
    const returnTo = `/donar/registrar-entrega?tipo=${tipo}`;
    return (
      <>
        <SiteHeader />
        <main className="container max-w-md py-10 md:py-16">
          <Card>
            <CardHeader>
              <CardTitle>Antes, regístrate</CardTitle>
              <CardDescription>
                Para registrar tu {tipo === 'bienes' ? 'entrega' : 'transferencia'} necesitamos
                asociarla a tu cuenta — así puedes seguirle el rastro. Toma 30 segundos.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button asChild>
                <Link href={`/registro?return_to=${encodeURIComponent(returnTo)}`}>Crear cuenta</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/login?return_to=${encodeURIComponent(returnTo)}`}>Ya tengo cuenta</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </>
    );
  }

  const supabase = await createSupabaseServer();
  const [eventosRes, centrosRes, influencersRes] = await Promise.all([
    supabase
      .from('eventos')
      .select('id, slug, nombre')
      .eq('activo', true)
      .order('fecha_inicio', { ascending: false, nullsFirst: false }),
    supabase
      .from('centros_acopio')
      .select('id, nombre, tipo, evento_id, direccion')
      .eq('activo', true),
    supabase
      .from('influencers')
      .select('id, nombre_publico, slug, evento_id')
      .eq('activo', true)
  ]);

  const eventos = eventosRes.data ?? [];
  const centros = centrosRes.data ?? [];
  const influencers = influencersRes.data ?? [];

  const title = tipo === 'bienes' ? 'Registrar tu entrega' : 'Registrar tu transferencia';
  const desc = tipo === 'bienes'
    ? 'Tres pasos: elige el evento, indica a qué centro entregaste (o agrega uno), y describe lo que donaste.'
    : 'Tres pasos: elige el evento, indica a qué influencer / fundación enviaste, y registra el monto + comprobante.';

  return (
    <>
      <SiteHeader />
      <main className="container max-w-2xl py-8 md:py-12">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
        <Card className="mt-6">
          <CardContent className="p-6">
            <RegistrarEntregaForm
              tipo={tipo}
              eventos={eventos}
              centros={centros}
              influencers={influencers}
            />
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
