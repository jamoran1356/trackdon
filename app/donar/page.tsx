import Link from 'next/link';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Box, Wallet, Banknote, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Donar' };

export default function DonarPage() {
  return (
    <>
      <SiteHeader />
      <main className="container max-w-3xl py-8 md:py-14">
        <Badge variant="outline" className="mb-4">Borrador · UI</Badge>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">¿Qué quieres donar?</h1>
        <p className="mt-3 text-muted-foreground">
          Cada donación queda registrada con tu nombre (o anónima si lo
          prefieres) y obtiene un ID de tracking para que puedas seguir
          su recorrido en cualquier momento.
        </p>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {[
            {
              icon: Box,
              title: 'Bienes físicos',
              desc: 'Ropa, comida, medicinas, agua, higiene.',
              cta: 'Registrar entrega'
            },
            {
              icon: Wallet,
              title: 'Cripto',
              desc: 'USDC / SOL directo a la wallet del centro o influencer.',
              cta: 'Conectar wallet'
            },
            {
              icon: Banknote,
              title: 'Transferencia',
              desc: 'Zelle, banco, otros. Subes comprobante para que quede registrado.',
              cta: 'Subir comprobante'
            }
          ].map((opt) => (
            <Card key={opt.title} className="group hover:border-primary/40 transition-colors">
              <CardContent className="p-5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <opt.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold">{opt.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{opt.desc}</p>
                <Button variant="ghost" size="sm" className="mt-4 px-0 text-primary hover:bg-transparent hover:text-primary/80" disabled>
                  {opt.cta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-10 border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base">Esta vista es un borrador</CardTitle>
            <CardDescription>
              La integración real (Supabase + wallet + comprobantes) llega en
              el primer sprint. Si quieres ayudar a construirla, abre un Issue
              en{' '}
              <Link
                href="https://github.com/jamoran1356/trackdon/issues/new"
                target="_blank"
                className="underline hover:no-underline"
              >
                el repo
              </Link>
              .
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
