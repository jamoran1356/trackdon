import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

export async function PreviewSection() {
  const t = await getTranslations('landing');
  const tInf = await getTranslations('influencer');
  const tDash = await getTranslations('dashboard');
  const tPub = await getTranslations('publico');

  const SHOTS = [
    {
      src: '/screenshots/perfil-influencer.png',
      alt: tInf('perfil_badge'),
      label: tInf('perfil_badge'),
      caption: tInf('perfil_progress_help').slice(0, 150) + '…'
    },
    {
      src: '/screenshots/panel-publico.png',
      alt: tPub('title'),
      label: tPub('title'),
      caption: tPub('subtitle')
    },
    {
      src: '/screenshots/dashboard-centro.png',
      alt: tDash('centro_badge'),
      label: tDash('centro_badge'),
      caption: tDash('centro_recientes_desc')
    },
    {
      src: '/screenshots/dashboard-influencer.png',
      alt: tDash('influencer_badge'),
      label: tDash('influencer_badge'),
      caption: tDash('influencer_progress_desc')
    }
  ];

  return (
    <section className="border-t border-border/40 bg-background">
      <div className="container py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">{t('preview_kicker')}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{t('preview_title')}</h2>
          <p className="mt-4 text-muted-foreground">{t('preview_subtitle')}</p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {SHOTS.map((s) => (
            <figure key={s.src} className="group">
              <div className="relative overflow-hidden rounded-[28px] border-[6px] border-foreground/90 bg-card shadow-xl transition-transform group-hover:-translate-y-1">
                <Image
                  src={s.src}
                  alt={s.alt}
                  width={780}
                  height={1500}
                  className="h-auto w-full"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <figcaption className="mt-4 text-center">
                <p className="text-sm font-semibold">{s.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
