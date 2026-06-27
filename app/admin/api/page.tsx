import { createSupabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { CreateKeyForm, KeyRowItem } from './components';
import { KeyRound } from 'lucide-react';

export const metadata = { title: 'API keys — admin' };
export const dynamic = 'force-dynamic';

export default async function AdminApiPage() {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from('api_keys')
    .select('id, name, description, key_prefix, scopes, creado_at, expira_at, revocada_at, last_used_at, call_count')
    .order('creado_at', { ascending: false });

  type Row = {
    id: string; name: string; description: string | null;
    key_prefix: string; scopes: string[];
    creado_at: string; expira_at: string | null;
    revocada_at: string | null; last_used_at: string | null;
    call_count: number;
  };
  const rows = (data ?? []) as Row[];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">API keys</h1>
        <p className="text-sm text-muted-foreground">
          Genera credenciales para que sistemas externos consuman el libro público vía REST.
          Endpoints disponibles bajo <code className="font-mono text-xs">/api/v1/*</code>.
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <KeyRound className="h-4 w-4" /> Crear API key
          </h2>
          <CreateKeyForm />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="mb-2 text-base font-semibold">Cómo usar la API</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Manda la key en el header <code className="font-mono">x-api-key</code> o como Bearer.
          </p>
          <pre className="overflow-x-auto rounded-md border border-border bg-muted/50 p-3 text-xs">
{`curl https://trackdonations.xyz/api/v1/cajas \\
  -H "x-api-key: tk_xxxxxxxx..."

# Endpoints disponibles:
GET /api/v1/cajas         # listado paginado de cajas selladas+
GET /api/v1/donaciones    # listado de donaciones registradas
GET /api/v1/centros       # centros activos
GET /api/v1/influencers   # influencers + auditoría
GET /api/v1/eventos       # eventos activos`}
          </pre>
        </CardContent>
      </Card>

      <h2 className="mb-3 text-base font-semibold">Keys existentes ({rows.length})</h2>
      {rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Sin keys creadas.</CardContent></Card>
      ) : (
        <div className="grid gap-2">{rows.map((k) => <KeyRowItem key={k.id} k={k} />)}</div>
      )}
    </>
  );
}
