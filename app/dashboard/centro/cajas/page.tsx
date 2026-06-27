import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';

export const metadata = { title: 'Cajas recibidas' };
export const dynamic = 'force-dynamic';

const estadoLabel: Record<string, string> = {
  sellada: 'Esperando recibo', recibida: 'Recibida',
  en_camion: 'En camión', en_via: 'En vía', distribuida: 'Distribuida'
};

export default async function CentroCajasPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!['centro_admin','centro_responsable','super_admin'].includes(user.rol)) redirect('/dashboard');

  const admin = createSupabaseAdmin();

  // Centros donde el user es responsable
  const { data: misResp } = await admin
    .from('responsables')
    .select('centro_id')
    .eq('usuario_auth_id', user.id);
  const centroIds = (misResp ?? []).map((r: { centro_id: string }) => r.centro_id);

  if (centroIds.length === 0 && user.rol !== 'super_admin') {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          No estás asignado como responsable de ningún centro todavía.
        </CardContent>
      </Card>
    );
  }

  let query = admin
    .from('cajas')
    .select('id, codigo, titulo, estado, donante_auth_id, creado_at, centros_acopio:centro_destino_id(nombre)')
    .neq('estado', 'borrador')
    .order('creado_at', { ascending: false });
  if (user.rol !== 'super_admin') {
    query = query.in('centro_destino_id', centroIds);
  }
  const { data: cajas } = await query;

  type Row = {
    id: string; codigo: string; titulo: string | null; estado: string;
    creado_at: string; centros_acopio?: { nombre: string } | null;
  };
  const rows = (cajas ?? []) as Row[];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Cajas recibidas</h1>
        <p className="text-sm text-muted-foreground">{rows.length} en total</p>
      </div>

      {rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          Aún no hay cajas asignadas a tu centro.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((c) => (
            <Link key={c.id} href={`/dashboard/centro/cajas/${c.id}`}>
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex items-start gap-3 p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Package className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">{c.codigo}</Badge>
                      <Badge variant={c.estado === 'distribuida' ? 'default' : 'secondary'}>
                        {estadoLabel[c.estado] ?? c.estado}
                      </Badge>
                    </div>
                    <p className="mt-1 font-medium">{c.titulo ?? 'Sin título'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(c.creado_at).toLocaleString()}</p>
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
