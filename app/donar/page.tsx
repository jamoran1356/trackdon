import Link from 'next/link';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Box, Banknote, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Donar' };

export default function DonarPage() {
  return (
    <>
      <SiteHeader />
      <main className="container max-w-3xl py-8 md:py-14">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">¿Qué quieres donar?</h1>
        <p className="mt-3 text-muted-foreground">
          trackdon <strong>no custodia fondos</strong> — somos un libro
          público. Tú entregas directo al centro o haces la transferencia, y
          aquí registras lo que pasó para que quede trazable.
        </p>

        <div className="mt-8 grid gap-3 md:grid-cols-2">
          <Card className="group transition-colors hover:border-primary/40">
            <CardContent className="p-5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Box className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">Bienes físicos</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ropa, comida, medicinas, agua, higiene. Lo entregas en un
                centro y aquí lo registramos con su rastro.
              </p>
              <Button asChild variant="ghost" size="sm" className="mt-4 px-0 text-primary hover:bg-transparent hover:text-primary/80">
                <Link href="/donar/registrar-entrega">
                  Registrar entrega <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group transition-colors hover:border-primary/40">
            <CardContent className="p-5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Banknote className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">Transferencia / Zelle</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tú envías directo a un influencer o fundación verificada.
                Suben el comprobante y queda en el registro público.
              </p>
              <Button asChild variant="ghost" size="sm" className="mt-4 px-0 text-primary hover:bg-transparent hover:text-primary/80">
                <Link href="/donar/registrar-entrega?tipo=transferencia">
                  Registrar transferencia <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="text-base">¿Por qué no procesamos donaciones en cripto?</CardTitle>
            <CardDescription>
              Decidimos no ser custodios. Si trackdon recibiera fondos y los
              distribuyera, asumimos responsabilidad legal y fiduciaria que no
              queremos. En cambio, somos el registro público: donas a quien
              elijas (centro o influencer), y aquí queda la traza verificable
              de lo que se hizo con tu aporte.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
