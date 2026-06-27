import Link from 'next/link';
import { createSupabaseServer } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, Calendar } from 'lucide-react';

export const metadata = { title: 'Eventos — admin' };

const categoriaLabel: Record<string, string> = {
  terremoto: 'Terremoto',
  inundacion: 'Inundación',
  huracan: 'Huracán',
  incendio: 'Incendio',
  conflicto: 'Conflicto',
  crisis_humanitaria: 'Crisis humanitaria',
  otro: 'Otro'
};

export default async function AdminEventosPage() {
  const supabase = await createSupabaseServer();
  const { data: eventos } = await supabase
    .from('eventos')
    .select('id, slug, nombre, categoria, lugar, fecha_inicio, activo, creado_at')
    .order('creado_at', { ascending: false });

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Eventos</h1>
          <p className="text-sm text-muted-foreground">
            Cada emergencia es un evento. Centros e influencers se asocian a uno.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/eventos/nuevo">
            <Plus className="h-4 w-4" /> Nuevo evento
          </Link>
        </Button>
      </div>

      {(eventos ?? []).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Sin eventos creados todavía. Crea el primero para empezar a recolectar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {(eventos ?? []).map((e: any) => (
            <Card key={e.id}>
              <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{categoriaLabel[e.categoria] ?? e.categoria}</Badge>
                    {e.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="secondary">Cerrado</Badge>}
                  </div>
                  <p className="mt-2 text-base font-semibold">{e.nombre}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>/{e.slug}</span>
                    {e.lugar && (<span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.lugar}</span>)}
                    {e.fecha_inicio && (<span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {e.fecha_inicio}</span>)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/e/${e.slug}`} target="_blank">Ver público</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
