import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VerificarForm } from './verificar-form';

export const metadata = { title: 'Verificar correo' };

interface Search { searchParams: Promise<{ email?: string }> }

export default async function VerificarPage({ searchParams }: Search) {
  const { email } = await searchParams;
  if (!email) redirect('/registro');

  return (
    <>
      <SiteHeader />
      <main className="container max-w-md py-10 md:py-16">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Verifica tu correo</CardTitle>
            <CardDescription>
              Te enviamos un código de 6 dígitos a <strong className="text-foreground">{email}</strong>.
              Pégalo aquí para activar tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VerificarForm email={email} />
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          ¿No te llegó? Revisa spam o usa el botón "Reenviar código".
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
