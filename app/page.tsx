import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { ExplorerFeed } from '@/components/landing/explorer-feed';
import { PatrocinadoresSection } from '@/components/landing/patrocinadores-section';
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

export default async function HomePage() {
  const t = await getTranslations('landing');

  const problemCards = [
    { label: t('problem_card1_label'), detail: t('problem_card1_detail') },
    { label: t('problem_card2_label'), detail: t('problem_card2_detail') },
    { label: t('problem_card3_label'), detail: t('problem_card3_detail') }
  ];

  const steps = [
    { step: '01', title: t('howit_step1_title'), body: t('howit_step1_body') },
    { step: '02', title: t('howit_step2_title'), body: t('howit_step2_body') },
    { step: '03', title: t('howit_step3_title'), body: t('howit_step3_body') }
  ];

  const actors = [
    { icon: HeartHandshake, title: t('actors_donante_title'), desc: t('actors_donante_desc') },
    { icon: Box, title: t('actors_centro_title'), desc: t('actors_centro_desc') },
    { icon: Megaphone, title: t('actors_influencer_title'), desc: t('actors_influencer_desc') }
  ];

  const principles = [
    { icon: ShieldCheck, title: t('principles_card1_title'), body: t('principles_card1_body') },
    { icon: Lock, title: t('principles_card2_title'), body: t('principles_card2_body') }
  ];

  return (
    <>
      <SiteHeader />
      <main className="min-h-dvh">
        {/* HERO */}
        <section className="relative overflow-hidden bg-mesh">
          <div className="container py-16 md:py-28 flex flex-col items-center text-center">
            <Badge variant="outline" className="mb-6 animate-fade-up">{t('badge_alpha')}</Badge>
            <h1 className="animate-fade-up max-w-3xl text-balance text-4xl font-bold tracking-tight md:text-6xl">
              {t('hero_title_a')} <span className="text-primary">{t('hero_title_highlight')}</span>.
            </h1>
            <p className="animate-fade-up mt-5 max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
              {t('hero_subtitle_a')} <strong className="text-foreground">{t('hero_donante')}</strong>,{' '}
              <strong className="text-foreground">{t('hero_centro')}</strong>,{' '}
              <strong className="text-foreground">{t('hero_damnificado')}</strong>.
            </p>
            <div className="animate-fade-up mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/donar">
                  {t('hero_cta_primary')}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="/publico">{t('hero_cta_secondary')}</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              {t('hero_footer_note')} · {' '}
              <Link href="https://github.com/jamoran1356/trackdon" target="_blank" className="inline-flex items-center gap-1 underline hover:text-foreground">
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
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">{t('problem_kicker')}</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{t('problem_title')}</h2>
                <p className="mt-4 text-muted-foreground">{t('problem_p1')}</p>
                <p className="mt-3 text-muted-foreground">{t('problem_p2')}</p>
              </div>
              <div className="grid gap-3">
                {problemCards.map((it) => (
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
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">{t('howit_kicker')}</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{t('howit_title')}</h2>
              <p className="mt-4 text-muted-foreground">{t('howit_subtitle')}</p>
            </div>
            <ol className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-3">
              {steps.map((s) => (
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

        <ExplorerFeed />

        {/* ACTORES */}
        <section className="border-t border-border/40">
          <div className="container py-16 md:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">{t('actors_kicker')}</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{t('actors_title')}</h2>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {actors.map((it) => (
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
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">{t('principles_kicker')}</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{t('principles_title')}</h2>
                <p className="mt-4 text-muted-foreground">{t('principles_p')}</p>
              </div>
              <div className="grid gap-3">
                {principles.map((it) => (
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

        <PatrocinadoresSection />
      </main>
      <SiteFooter />
    </>
  );
}
