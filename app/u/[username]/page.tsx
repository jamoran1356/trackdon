import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Package, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function PersonaPublicPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const admin = createSupabaseAdmin();

  // Buscar por username (case-insensitive) o anon_id
  const lower = username.toLowerCase();
  const { data: perfil } = await admin
    .from('perfiles')
    .select('id, username, anon_id, kyc_verificado_at, banned_at')
    .or(`username.ilike.${lower},anon_id.ilike.${lower}`)
    .limit(1)
    .maybeSingle();
  if (!perfil) notFound();

  const { data: cajas } = await admin
    .from('cajas')
    .select('id, codigo, titulo, estado, creado_at, centros_acopio:centro_destino_id(nombre)')
    .eq('donante_auth_id', perfil.id)
    .neq('estado', 'borrador')
    .order('creado_at', { ascending: false })
    .limit(50);

  type CajaRow = {
    id: string; codigo: string; titulo: string | null; estado: string; creado_at: string;
    centros_acopio?: { nombre: string } | null;
  };
  const rows = (cajas ?? []) as CajaRow[];

  return (
    <>
      <SiteHeader />
      <main className="container max-w-3xl py-8 md:py-12 space-y-6">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <User className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-mono text-3xl font-bold">@{perfil.username}</h1>
            <p className="text-sm text-muted-foreground">{perfil.anon_id}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {perfil.kyc_verificado_at && <Badge variant="default"><CheckCircle2 className="h-3 w-3" /> KYC verificado</Badge>}
              {perfil.banned_at && <Badge variant="warning">Cuenta suspendida</Badge>}
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3 text-base font-semibold">Cajas que registró ({rows.length})</h2>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no registró cajas públicas.</p>
            ) : (
              <div className="grid gap-2">
                {rows.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-md border border-border/60 p-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{c.titulo ?? 'Sin título'}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">{c.codigo}</span> · {c.estado}
                        {c.centros_acopio?.nombre && <> → {c.centros_acopio.nombre}</>}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(c.creado_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
