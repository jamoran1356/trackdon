import Link from 'next/link';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Github } from 'lucide-react';

export const metadata = { title: 'Sobre trackdon' };

export default function SobrePage() {
  return (
    <>
      <SiteHeader />
      <main className="container max-w-3xl py-10 md:py-16">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Sobre trackdon</h1>
        <p className="mt-4 text-muted-foreground">
          trackdon es una aplicación open source para que después de una
          emergencia humanitaria toda la ayuda quede centralizada,
          inventariada y trazable. Diseñada primero para teléfono porque la
          mayoría de los voluntarios trabajan desde campo.
        </p>

        <h2 className="mt-10 text-2xl font-semibold tracking-tight">No custodiamos fondos</h2>
        <p className="mt-3 text-muted-foreground">
          trackdon es un <strong className="text-foreground">libro público</strong>,
          no una pasarela de pagos ni un intermediario. La gente dona
          directamente al centro de acopio o al influencer; aquí queda el
          registro verificable de lo que se entregó, quién lo movió y a
          dónde llegó. No recibimos ni distribuimos dinero.
        </p>

        <h2 className="mt-10 text-2xl font-semibold tracking-tight">Estado</h2>
        <p className="mt-3 text-muted-foreground">
          Alpha. Corre sobre Supabase + Next.js + Vercel. El repo es público
          y cualquiera puede auditar el código o proponer mejoras.
        </p>

        <h2 className="mt-10 text-2xl font-semibold tracking-tight">Privacidad</h2>
        <p className="mt-3 text-muted-foreground">
          La identidad real de los damnificados se maneja con KYC
          tercerizado (Civic Pass, Truora o Persona). En la base solo
          guardamos lo mínimo necesario; el padrón está protegido por RLS
          de Postgres con scope restringido a validadores autorizados.
        </p>

        <Card className="mt-12 bg-accent/30">
          <CardContent className="p-6">
            <p className="font-semibold">Quieres contribuir.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Buscamos personas en Next.js + Supabase, diseño mobile,
              Solana / Anchor, legal y conexión con ONGs. Abre un Issue o un
              PR pequeño y conversamos.
            </p>
            <Link
              href="https://github.com/jamoran1356/trackdon"
              target="_blank"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <Github className="h-4 w-4" /> jamoran1356/trackdon
            </Link>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
