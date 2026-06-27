import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DenunciaForm } from './form';

export const metadata = { title: 'Denunciar una irregularidad' };

export default function DenunciarPage() {
  return (
    <>
      <SiteHeader />
      <main className="container max-w-2xl py-10 md:py-16">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Denunciar una irregularidad</CardTitle>
            <CardDescription>
              Si viste algo raro en cómo se manejó una donación, repórtalo aquí.
              Puedes hacerlo de forma anónima. Un validador autorizado revisará tu
              denuncia y dará seguimiento.
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
