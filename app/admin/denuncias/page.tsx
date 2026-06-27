import { createSupabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

export const metadata = { title: 'Denuncias — admin' };
export const dynamic = 'force-dynamic';

const estadoBadge: Record<string, 'default' | 'secondary' | 'outline' | 'warning'> = {
  abierta: 'warning',
  en_revision: 'default',
  cerrada: 'secondary',
  desestimada: 'outline'
};

export default async function AdminDenunciasPage() {
  const admin = createSupabaseAdmin();
  const { data: rows } = await admin
    .from('denuncias')
    .select('id, tipo, estado, reporter_nombre, descripcion, creado_at')
    .order('creado_at', { ascending: false })
    .limit(200);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Denuncias</h1>
        <p className="text-sm text-muted-foreground">{(rows ?? []).length} denuncias</p>
      </div>

      {(rows ?? []).length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Sin denuncias.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {(rows ?? []).map((d: { id: string; tipo: string; estado: string; reporter_nombre: string | null; descripcion: string; creado_at: string }) => (
            <Card key={d.id}>
              <CardContent className="flex gap-3 p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{d.tipo}</Badge>
                    <Badge variant={estadoBadge[d.estado] ?? 'secondary'}>{d.estado}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm">{d.descripcion}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {d.reporter_nombre ?? 'anónimo'} · {new Date(d.creado_at).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
