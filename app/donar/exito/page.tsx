import Link from 'next/link';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export const metadata = { title: 'Entrega registrada' };

interface Search { searchParams: Promise<{ id?: string }> }

export default async function ExitoPage({ searchParams }: Search) {
  const { id } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="container max-w-md py-16 md:py-24 text-center">
        <Card>
          <CardContent className="space-y-4 p-8">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Entrega registrada</h1>
            <p className="text-sm text-muted-foreground">
              Quedó en el libro público. Cualquiera con el link puede ver el
              movimiento de tu donación.
            </p>
            {id && (
              <p className="font-mono text-xs text-muted-foreground">
                ID de tracking: <span className="select-all">{id}</span>
              </p>
            )}
            <div className="flex flex-col gap-2 pt-2">
              <Button asChild>
                <Link href="/publico">Ver panel público</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/donar/registrar-entrega">Registrar otra</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
