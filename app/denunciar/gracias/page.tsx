import Link from 'next/link';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export const metadata = { title: 'Denuncia recibida' };

export default function GraciasPage() {
  return (
    <>
      <SiteHeader />
      <main className="container max-w-md py-16 md:py-24 text-center">
        <Card>
          <CardContent className="space-y-4 p-8">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Denuncia recibida</h1>
            <p className="text-sm text-muted-foreground">
              Un validador autorizado la revisará. Si dejaste correo, te
              avisaremos por ahí cuando se resuelva. Gracias por ayudar a que
              esto sea transparente.
            </p>
            <Button asChild className="mt-2">
              <Link href="/publico">Ver panel público</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
