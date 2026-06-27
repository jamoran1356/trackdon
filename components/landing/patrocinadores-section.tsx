import { createSupabaseAdmin } from '@/lib/supabase/server';

type Patrocinador = {
  id: string; empresa: string; logo_url: string; url: string | null; orden: number;
};

export async function PatrocinadoresSection() {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from('patrocinadores')
    .select('id, empresa, logo_url, url, orden')
    .eq('activo', true)
    .order('orden', { ascending: true });

  const rows = (data ?? []) as Patrocinador[];
  if (rows.length === 0) return null;

  return (
    <section className="border-t border-border/40 bg-background">
      <div className="container py-16 md:py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Apoyan esta iniciativa</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
          Patrocinadores
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Organizaciones y empresas que sostienen la transparencia.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 items-center justify-items-center">
          {rows.map((p) => {
            const inner = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.logo_url}
                alt={p.empresa}
                title={p.empresa}
                className="max-h-12 w-auto opacity-70 transition-opacity hover:opacity-100"
              />
            );
            return p.url ? (
              <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="flex items-center justify-center">
                {inner}
              </a>
            ) : (
              <div key={p.id} className="flex items-center justify-center">{inner}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
