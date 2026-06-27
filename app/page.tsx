import Link from 'next/link';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  Box,
  HeartHandshake,
  Megaphone,
  ShieldCheck,
  Lock,
  Github
} from 'lucide-react';

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-dvh">
        {/* HERO */}
        <section className="relative overflow-hidden bg-mesh">
          <div className="container py-16 md:py-28 flex flex-col items-center text-center">
            <Badge variant="outline" className="mb-6 animate-fade-up">
              alpha · pre-deploy
            </Badge>
            <h1 className="animate-fade-up max-w-3xl text-balance text-4xl font-bold tracking-tight md:text-6xl">
              Cada donación con su <span className="text-primary">rastro</span>.
            </h1>
            <p className="animate-fade-up mt-5 max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
              Después de una emergencia humanitaria, tu aporte pierde
              visibilidad apenas lo entregas. trackdon centraliza todo el
              flujo: <strong className="text-foreground">quién donó</strong>,{' '}
              <strong className="text-foreground">qué centro lo recibió</strong>,{' '}
              <strong className="text-foreground">cómo llegó al damnificado</strong>.
            </p>
            <div className="animate-fade-up mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/donar">
                  Donar y trackear
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="/publico">Ver panel público</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Open source MIT · sin fines de lucro · {' '}
              <Link
                href="https://github.com/jamoran1356/trackdon"
                target="_blank"
                className="inline-flex items-center gap-1 underline hover:text-foreground"
              >
                <Github className="h-3 w-3" /> jamoran1356/trackdon
              </Link>
            </p>
          </div>
        </section>

        {/* PROBLEMA */}
        <section className="border-t border-border/40 bg-background">
          <div className="container py-16 md:py-24">
            <div className="grid gap-12 md:grid-cols-2 md:gap-16">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">El problema</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                  El rastro termina en la entrega inicial.
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Cuando ocurre una emergencia, miles de personas donan: cajas
                  de ropa, comida, medicinas, dinero. Esa ayuda pasa por
                  centros de acopio, fundaciones, influencers, voluntarios. La
                  gente que aportó nunca vuelve a saber qué pasó con su
                  donación.
                </p>
                <p className="mt-3 text-muted-foreground">
                  Y siempre aparece alguien aprovechándose de la urgencia para
                  quedarse con recursos ajenos. Sin trazabilidad, esa fuga es
                  invisible.
                </p>
              </div>
              <div className="grid gap-3">
                {[
                  {
                    label: 'Donaciones registradas sin destino',
                    detail: 'Cajas que llegan al centro pero no se inventarían.'
                  },
                  {
                    label: 'Cash sin rendición',
                    detail:
                      'Transferencias a fundaciones e influencers que nunca publican en qué se usó.'
                  },
                  {
                    label: 'Damnificados sin verificar',
                    detail:
                      'No hay padrón confiable, lo que abre la puerta a duplicados y oportunistas.'
                  }
                ].map((it) => (
                  <Card key={it.label} className="border-destructive/15">
                    <CardContent className="p-5">
                      <p className="font-medium">{it.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{it.detail}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section className="border-t border-border/40 bg-accent/30">
          <div className="container py-16 md:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">Cómo funciona</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                Tres pasos. Todos públicos.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Cada movimiento queda registrado y se puede consultar desde la
                vista pública, sin login.
              </p>
            </div>
            <ol className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'Donas',
                  body:
                    'Registras qué donaste y a qué centro o influencer va. Recibes un ID de tracking.'
                },
                {
                  step: '02',
                  title: 'Se mueve',
                  body:
                    'Centros e influencers documentan custodia, inventario y traslados. Cada paso queda firmado.'
                },
                {
                  step: '03',
                  title: 'Llega',
                  body:
                    'Validadores autorizan damnificados (KYC tercerizado, pseudónimo). La entrega final también queda registrada.'
                }
              ].map((s) => (
                <li key={s.step}>
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <span className="font-mono text-sm text-primary">{s.step}</span>
                      <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ACTORES */}
        <section className="border-t border-border/40">
          <div className="container py-16 md:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">Para cada actor</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                Un dashboard por responsabilidad.
              </h2>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: HeartHandshake,
                  title: 'Donante',
                  desc:
                    'Registra tu aporte y sigue su recorrido. Si quieres figurar públicamente, lo decides tú.'
                },
                {
                  icon: Box,
                  title: 'Centro de acopio',
                  desc:
                    'Inventarea, custodia y mueve. Cada responsable firma con su cuenta.'
                },
                {
                  icon: Megaphone,
                  title: 'Influencer / fundación',
                  desc:
                    'Recibe cash. Rinde cuentas con recibos y transferencias documentadas, no con stories.'
                }
              ].map((it) => (
                <Card key={it.title} className="group hover:border-primary/40 transition-colors">
                  <CardContent className="p-6">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <it.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{it.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* PRINCIPIOS */}
        <section className="border-t border-border/40 bg-accent/30">
          <div className="container py-16 md:py-24">
            <div className="grid gap-12 md:grid-cols-2 md:gap-16">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">Principios</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                  Transparencia hacia quien maneja. Dignidad para quien recibe.
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Los centros, influencers y validadores están sujetos al
                  escrutinio público. Los damnificados aparecen como
                  pseudónimos: su identidad real solo la conocen los
                  validadores autorizados.
                </p>
              </div>
              <div className="grid gap-3">
                {[
                  {
                    icon: ShieldCheck,
                    title: 'KYC tercerizado',
                    body:
                      'La verificación de identidad la maneja un proveedor especializado (Civic Pass / Truora / Persona). Nosotros no manejamos PII sensible.'
                  },
                  {
                    icon: Lock,
                    title: 'Código abierto, datos privados',
                    body:
                      'El repo es público (MIT). El padrón, las fotos y las facturas viven con permisos estrictos y nunca se exponen.'
                  }
                ].map((it) => (
                  <Card key={it.title}>
                    <CardContent className="p-5 flex gap-4">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <it.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{it.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{it.body}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/40">
          <div className="container py-16 md:py-24 text-center">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
              ¿Construyes algo así? Hace falta gente.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Buscamos contribuidores en Next.js + Supabase, diseño mobile,
              Solana/Anchor (fase 2), legal y validación con ONGs.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link href="https://github.com/jamoran1356/trackdon" target="_blank">
                  <Github className="h-4 w-4" /> Ver código
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="https://github.com/jamoran1356/trackdon/issues/new" target="_blank">
                  Proponer mejora
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
