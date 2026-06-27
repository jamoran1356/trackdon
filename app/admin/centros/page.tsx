import { createSupabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Warehouse, MapPin } from 'lucide-react';

export const metadata = { title: 'Centros — admin' };
export const dynamic = 'force-dynamic';

export default async function AdminCentrosPage() {
  const admin = createSupabaseAdmin();
  const { data: centros } = await admin
    .from('centros_acopio')
    .select('id, nombre, tipo, direccion, activo, evento_id, creado_at')
    .order('creado_at', { ascending: false });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Centros de acopio</h1>
        <p className="text-sm text-muted-foreground">{(centros ?? []).length} centros</p>
      </div>

      {(centros ?? []).length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Sin centros aún.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {(centros ?? []).map((c: { id: string; nombre: string; tipo: string; direccion: string | null; activo: boolean }) => (
            <Card key={c.id}>
              <CardContent className="flex items-start gap-3 p-5">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Warehouse className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{c.nombre}</p>
                    <Badge variant="outline">{c.tipo}</Badge>
                    {!c.activo && <Badge variant="secondary">Inactivo</Badge>}
                  </div>
                  {c.direccion && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {c.direccion}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
