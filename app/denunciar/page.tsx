import Link from 'next/link';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSessionUser } from '@/lib/auth';
import { DenunciaForm } from './form';

export const metadata = { title: 'Denunciar una irregularidad' };

export default async function DenunciarPage() {
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
                Para denunciar necesitamos saber quién reporta — los datos no se
                hacen públicos. Validadores autorizados ven tu identidad solo
                si necesitan contactarte; en el panel público las denuncias son
                <strong className="text-foreground"> anónimas para el resto</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/registro?return_to=/denunciar">Crear cuenta</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login?return_to=/denunciar">Ya tengo cuenta</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="container max-w-2xl py-10 md:py-16">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Denunciar una irregularidad</CardTitle>
            <CardDescription>
              Anónima públicamente — solo validadores autorizados pueden ver tu
              identidad, y solo para contactarte si necesitan más datos. Máximo
              5 denuncias por usuario / 24 h.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DenunciaForm />
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
