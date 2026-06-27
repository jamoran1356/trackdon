import Link from 'next/link';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { UsersTable } from './users-table';

export const metadata = { title: 'Usuarios — admin' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function AdminUsuariosPage({
  searchParams
}: { searchParams: Promise<{ q?: string; page?: string; rol?: string }> }) {
  const { q, page: pageRaw, rol: rolFilter } = await searchParams;
  const page = Math.max(1, parseInt(pageRaw ?? '1', 10) || 1);
  const needle = (q ?? '').trim();
  const admin = createSupabaseAdmin();

  let query = admin
    .from('perfiles')
    .select('id, anon_id, username, nombre_real, kyc_verificado_at, rol, nombre_mostrado, banned_at, banned_motivo, creado_at', { count: 'exact' })
    .order('creado_at', { ascending: false });

  if (rolFilter && rolFilter !== 'todos') {
    query = query.eq('rol', rolFilter);
  }
  if (needle) {
    query = query.or(`username.ilike.%${needle}%,anon_id.ilike.%${needle}%,nombre_real.ilike.%${needle}%,nombre_mostrado.ilike.%${needle}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: perfiles, count } = await query.range(from, to);

  // Map de emails
  const { data: usersList } = await admin.auth.admin.listUsers({ page: 1, perPage: 500 });
  const emailById = new Map((usersList?.users ?? []).map((u: { id: string; email?: string }) => [u.id, u.email ?? '']));

  type PerfilRow = {
    id: string; anon_id: string; username: string; nombre_real: string | null;
    kyc_verificado_at: string | null; rol: string; nombre_mostrado: string | null;
    banned_at: string | null; banned_motivo: string | null; creado_at: string;
  };

  const rows: (PerfilRow & { email: string })[] = ((perfiles ?? []) as PerfilRow[]).map((p) => ({
    ...p,
    email: String(emailById.get(p.id) ?? '')
  }));

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const ROLES_FILTER = ['todos', 'donante', 'centro_admin', 'centro_responsable', 'influencer', 'validador', 'super_admin'];

  function qs(extra: Record<string, string | undefined>): string {
    const params = new URLSearchParams();
    const merged: Record<string, string | undefined> = { q: needle || undefined, rol: rolFilter, page: String(page), ...extra };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== '' && v !== 'todos' && k !== undefined) params.set(k, v);
    }
    const s = params.toString();
    return s ? `?${s}` : '';
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Usuarios y roles</h1>
        <p className="text-sm text-muted-foreground">{count ?? 0} usuarios · página {page}/{totalPages}</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {ROLES_FILTER.map((r) => (
          <Link
            key={r}
            href={`/admin/usuarios${qs({ rol: r, page: '1' })}`}
            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium ${
              (rolFilter ?? 'todos') === r
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input hover:bg-accent'
            }`}
          >
            {r}
          </Link>
        ))}
        <form className="ml-auto">
          {rolFilter && <input type="hidden" name="rol" value={rolFilter} />}
          <input
            type="search" name="q" defaultValue={needle}
            placeholder="Buscar @username, anon_id, nombre…"
            className="w-64 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
        </form>
      </div>

      {rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Sin resultados.</CardContent></Card>
      ) : (
        <UsersTable users={rows} />
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={`/admin/usuarios${qs({ page: String(page - 1) })}`}
              className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent">
              ← Anterior
            </Link>
          )}
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={`/admin/usuarios${qs({ page: String(page + 1) })}`}
              className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent">
              Siguiente →
            </Link>
          )}
        </div>
      )}
    </>
  );
}
