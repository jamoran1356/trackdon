import Link from 'next/link';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Warehouse, Megaphone, User, Search } from 'lucide-react';

export const metadata = { title: 'Explorador trackdon' };
export const dynamic = 'force-dynamic';

const TIPOS = ['centros', 'personas', 'influencers'] as const;
type Tipo = typeof TIPOS[number];

export default async function ExplorarPage({
  searchParams
}: { searchParams: Promise<{ tipo?: string; q?: string }> }) {
  const { tipo: tipoRaw, q } = await searchParams;
  const tipo: Tipo = (TIPOS as readonly string[]).includes(tipoRaw ?? '') ? (tipoRaw as Tipo) : 'centros';
  const needle = (q ?? '').trim();
  const admin = createSupabaseAdmin();

  let centros: { id: string; nombre: string; tipo: string; direccion: string | null }[] = [];
  let personas: { id: string; username: string; anon_id: string }[] = [];
  let influencers: { id: string; slug: string; nombre_publico: string; verificado_at: string | null }[] = [];

  if (tipo === 'centros') {
    let qb = admin.from('centros_acopio').select('id, nombre, tipo, direccion').eq('activo', true).limit(50);
    if (needle) qb = qb.ilike('nombre', `%${needle}%`);
    const { data } = await qb;
    centros = (data ?? []) as typeof centros;
  } else if (tipo === 'personas') {
    let qb = admin.from('perfiles').select('id, username, anon_id').limit(50);
    if (needle) qb = qb.or(`username.ilike.%${needle}%,anon_id.ilike.%${needle}%`);
    const { data } = await qb;
    personas = (data ?? []) as typeof personas;
  } else {
    let qb = admin.from('influencers').select('id, slug, nombre_publico, verificado_at').eq('activo', true).limit(50);
    if (needle) qb = qb.ilike('nombre_publico', `%${needle}%`);
    const { data } = await qb;
    influencers = (data ?? []) as typeof influencers;
  }

  return (
    <>
      <SiteHeader />
      <main className="container py-8 md:py-12">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Explorador</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Busca en el libro público</h1>
          <p className="mt-2 text-muted-foreground">
            Cualquier donación, cualquier centro, cualquier persona — todo el rastro está aquí.
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {TIPOS.map((t) => (
            <Link
              key={t}
              href={`/explorar?tipo=${t}${needle ? `&q=${encodeURIComponent(needle)}` : ''}`}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                tipo === t
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input hover:bg-accent'
              }`}
            >
              {t === 'centros' && <Warehouse className="h-4 w-4" />}
              {t === 'personas' && <User className="h-4 w-4" />}
              {t === 'influencers' && <Megaphone className="h-4 w-4" />}
              {t === 'centros' ? 'Centros' : t === 'personas' ? 'Personas' : 'Influencers'}
            </Link>
          ))}
        </div>

        {/* Search */}
        <form className="mt-4 max-w-md">
          <input type="hidden" name="tipo" value={tipo} />
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              name="q"
              defaultValue={needle}
              placeholder={
                tipo === 'centros' ? 'Nombre del centro…' :
                tipo === 'personas' ? '@username o u_NNNNN…' :
                'Nombre del influencer…'
              }
              className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm"
            />
          </div>
        </form>

        {/* Resultados */}
        <div className="mt-6 grid gap-3">
          {tipo === 'centros' && centros.map((c) => (
            <Link key={c.id} href={`/c/${c.id}`}>
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex items-start gap-3 p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Warehouse className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{c.nombre}</p>
                      <Badge variant="outline">{c.tipo}</Badge>
                    </div>
                    {c.direccion && <p className="text-xs text-muted-foreground">{c.direccion}</p>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {tipo === 'personas' && personas.map((p) => (
            <Link key={p.id} href={`/u/${p.username}`}>
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex items-center gap-3 p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-mono font-semibold">@{p.username}</p>
                    <p className="text-xs text-muted-foreground">{p.anon_id}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {tipo === 'influencers' && influencers.map((i) => (
            <Link key={i.id} href={`/i/${i.slug}`}>
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex items-center gap-3 p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Megaphone className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{i.nombre_publico}</p>
                      {i.verificado_at && <Badge variant="default">Verificado</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">/{i.slug}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {((tipo === 'centros' && centros.length === 0) ||
            (tipo === 'personas' && personas.length === 0) ||
            (tipo === 'influencers' && influencers.length === 0)) && (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
              Sin resultados.
            </CardContent></Card>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
