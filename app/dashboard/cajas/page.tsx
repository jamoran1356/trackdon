import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Plus } from 'lucide-react';

export const metadata = { title: 'Mis cajas' };
export const dynamic = 'force-dynamic';

const estadoLabel: Record<string, string> = {
  borrador: 'Borrador', sellada: 'Sellada', recibida: 'Recibida',
  en_camion: 'En camión', en_via: 'En vía', distribuida: 'Distribuida'
};

const estadoTone: Record<string, 'default' | 'secondary' | 'outline' | 'warning'> = {
  borrador: 'outline', sellada: 'secondary', recibida: 'default',
  en_camion: 'default', en_via: 'default', distribuida: 'default'
};

export default async function MisCajasPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const admin = createSupabaseAdmin();
  const { data: cajas } = await admin
    .from('cajas')
    .select('id, codigo, titulo, estado, centro_destino_id, creado_at, centros_acopio:centro_destino_id(nombre)')
    .eq('donante_auth_id', user.id)
    .order('creado_at', { ascending: false });

  type Row = {
    id: string; codigo: string; titulo: string | null; estado: string;
    centro_destino_id: string | null; creado_at: string;
    centros_acopio?: { nombre: string } | null;
  };
  const rows = (cajas ?? []) as Row[];

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Mis cajas</h1>
          <p className="text-sm text-muted-foreground">{rows.length} en total</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/cajas/nueva"><Plus className="h-4 w-4" /> Nueva caja</Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          Aún no creaste cajas. Empezá con la primera.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((c) => (
            <Link key={c.id} href={`/dashboard/cajas/${c.id}`}>
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex items-start gap-3 p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Package className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">{c.codigo}</Badge>
                      <Badge variant={estadoTone[c.estado] ?? 'secondary'}>{estadoLabel[c.estado] ?? c.estado}</Badge>
                    </div>
                    <p className="mt-1 font-medium">{c.titulo ?? 'Sin título'}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.centros_acopio?.nombre ?? 'Sin centro asignado'} · {new Date(c.creado_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
