import { createSupabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollText } from 'lucide-react';

export const metadata = { title: 'Auditoría — admin' };
export const dynamic = 'force-dynamic';

export default async function AdminAuditoriaPage() {
  const admin = createSupabaseAdmin();
  const { data: rows } = await admin
    .from('audit_log')
    .select('id, accion, tabla, registro_id, actor_auth_id, timestamp, payload, tx_solana')
    .order('timestamp', { ascending: false })
    .limit(500);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Auditoría</h1>
        <p className="text-sm text-muted-foreground">{(rows ?? []).length} eventos registrados (últimos 500)</p>
      </div>

      {(rows ?? []).length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">El log de auditoría está vacío.</CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {(rows ?? []).map((r: { id: string; accion: string; tabla: string; registro_id: string | null; actor_auth_id: string | null; timestamp: string; tx_solana: string | null }) => (
            <Card key={r.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <ScrollText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">{r.accion}</Badge>
                    <Badge variant="outline" className="font-mono text-xs">{r.tabla}</Badge>
                    {r.tx_solana && <Badge variant="default" className="font-mono text-xs">tx</Badge>}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {new Date(r.timestamp).toLocaleString()} · actor {r.actor_auth_id?.slice(0, 8) ?? 'sistema'} · reg {r.registro_id?.slice(0, 8) ?? '—'}
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
