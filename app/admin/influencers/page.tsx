import { createSupabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, CheckCircle2, Clock } from 'lucide-react';

export const metadata = { title: 'Influencers — admin' };
export const dynamic = 'force-dynamic';

export default async function AdminInfluencersPage() {
  const admin = createSupabaseAdmin();
  const { data: infs } = await admin
    .from('influencers')
    .select('id, slug, nombre_publico, activo, verificado_at, rechazado_at, evento_id, creado_at')
    .order('creado_at', { ascending: false });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Influencers</h1>
        <p className="text-sm text-muted-foreground">{(infs ?? []).length} influencers</p>
      </div>

      {(infs ?? []).length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Sin influencers registrados.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {(infs ?? []).map((i: { id: string; slug: string; nombre_publico: string; activo: boolean; verificado_at: string | null; rechazado_at: string | null }) => (
            <Card key={i.id}>
              <CardContent className="flex items-start gap-3 p-5">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Megaphone className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{i.nombre_publico}</p>
                    <Badge variant="outline" className="font-mono text-xs">/{i.slug}</Badge>
                    {i.verificado_at ? (
                      <Badge variant="default"><CheckCircle2 className="h-3 w-3" /> Verificado</Badge>
                    ) : i.rechazado_at ? (
                      <Badge variant="warning">Rechazado</Badge>
                    ) : (
                      <Badge variant="secondary"><Clock className="h-3 w-3" /> Pendiente</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
