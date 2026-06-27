import { createSupabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { UserRow } from './user-row';

export const metadata = { title: 'Usuarios — admin' };
export const dynamic = 'force-dynamic';

export default async function AdminUsuariosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const admin = createSupabaseAdmin();

  const { data: perfiles } = await admin
    .from('perfiles')
    .select('id, anon_id, username, nombre_real, kyc_verificado_at, rol, nombre_mostrado, banned_at, banned_motivo, creado_at')
    .order('creado_at', { ascending: false })
    .limit(200);

  // Email viene de auth.users — listamos en paralelo y mapeamos por id
  const { data: usersList } = await admin.auth.admin.listUsers({ page: 1, perPage: 500 });
  const emailById = new Map((usersList?.users ?? []).map((u: { id: string; email?: string }) => [u.id, u.email ?? '']));

  type PerfilRow = {
    id: string; anon_id: string; username: string; nombre_real: string | null;
    kyc_verificado_at: string | null; rol: string; nombre_mostrado: string | null;
    banned_at: string | null; banned_motivo: string | null; creado_at: string;
  };

  let rows = (perfiles ?? []).map((p: PerfilRow) => ({
    ...p,
    email: emailById.get(p.id) ?? ''
  }));

  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((r: PerfilRow & { email: string }) =>
      (r.email ?? '').toLowerCase().includes(needle) ||
      (r.anon_id ?? '').toLowerCase().includes(needle) ||
      (r.username ?? '').toLowerCase().includes(needle) ||
      (r.nombre_real ?? '').toLowerCase().includes(needle) ||
      (r.nombre_mostrado ?? '').toLowerCase().includes(needle)
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Usuarios y roles</h1>
          <p className="text-sm text-muted-foreground">{rows.length} {rows.length === 1 ? 'usuario' : 'usuarios'}</p>
        </div>
        <form>
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Buscar email, anon_id o nombre…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm md:w-72"
          />
        </form>
      </div>

      {rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Sin usuarios.</CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {rows.map((r: PerfilRow & { email: string }) => (
            <UserRow key={r.id} user={r} />
          ))}
        </div>
      )}
    </>
  );
}
