import Image from 'next/image';

interface Shot {
  src: string;
  alt: string;
  label: string;
  caption: string;
}

const SHOTS: Shot[] = [
  {
    src: '/screenshots/perfil-influencer.png',
    alt: 'Perfil público de un influencer en trackdon mostrando recibido, entregado y rendiciones verificadas',
    label: 'Perfil público',
    caption: 'Cada influencer comparte un link como /i/su-nombre. Sus seguidores ven recibido, entregado y solo cuenta lo conciliado con factura.'
  },
  {
    src: '/screenshots/panel-publico.png',
    alt: 'Panel público con totales agregados y donaciones recientes',
    label: 'Panel público',
    caption: 'Cualquiera, sin login, ve cuánto se ha movido y a dónde — totales en vivo y donaciones recientes.'
  },
  {
    src: '/screenshots/dashboard-centro.png',
    alt: 'Dashboard del centro de acopio con inventario y movimientos',
    label: 'Dashboard centro',
    caption: 'Los centros inventarían cada entrada y salida. Cada movimiento queda firmado por un responsable.'
  },
  {
    src: '/screenshots/dashboard-influencer.png',
    alt: 'Dashboard del influencer con rendiciones y progreso',
    label: 'Dashboard influencer',
    caption: 'Los influencers ven su balance recibido vs. rendido y suben los comprobantes de cada gasto.'
  }
];

export function PreviewSection() {
  return (
    <section className="border-t border-border/40 bg-background">
      <div className="container py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Así se ve</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Hecho para teléfono, transparente por defecto.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Capturas reales de la app — no maquetas. Cada usuario tiene su
            dashboard según su responsabilidad.
          </p>
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
