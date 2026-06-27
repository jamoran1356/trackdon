import { createSupabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { InfluencerAuditCard } from './components';
import Link from 'next/link';

export const metadata = { title: 'Auditoría de influencers — admin' };
export const dynamic = 'force-dynamic';

const FILTROS = ['todos', 'ok', 'sospechoso', 'desactivado', 'bajo_ratio', 'sin_rendir'] as const;
type Filtro = typeof FILTROS[number];

interface Row {
  id: string; slug: string; nombre_publico: string;
  verificado_at: string | null; activo: boolean;
  revision_estado: 'ok' | 'sospechoso' | 'desactivado';
  revision_motivo: string | null;
  total_recibido_usd: number;
  count_donaciones: number;
  total_rendido_usd: number;
  rendiciones_verificadas: number;
  rendiciones_pendientes: number;
  ratio_rendicion_pct: number | null;
  denuncias_count: number;
}

export default async function AdminInfluencersAudit({
  searchParams
}: { searchParams: Promise<{ filtro?: string; q?: string }> }) {
  const { filtro: filtroRaw, q } = await searchParams;
  const filtro: Filtro = (FILTROS as readonly string[]).includes(filtroRaw ?? '') ? (filtroRaw as Filtro) : 'todos';
  const needle = (q ?? '').trim();

  const admin = createSupabaseAdmin();
  let query = admin.from('v_influencer_auditoria').select('*').order('total_recibido_usd', { ascending: false }).limit(200);
  if (needle) query = query.ilike('nombre_publico', `%${needle}%`);

  const { data } = await query;
  let rows = (data ?? []) as Row[];

  if (filtro === 'ok') rows = rows.filter((r) => r.revision_estado === 'ok');
  else if (filtro === 'sospechoso') rows = rows.filter((r) => r.revision_estado === 'sospechoso');
  else if (filtro === 'desactivado') rows = rows.filter((r) => r.revision_estado === 'desactivado');
  else if (filtro === 'bajo_ratio') {
    rows = rows.filter((r) => r.total_recibido_usd > 0 && (r.ratio_rendicion_pct ?? 0) < 40);
  } else if (filtro === 'sin_rendir') {
    rows = rows.filter((r) => r.total_recibido_usd > 0 && r.rendiciones_verificadas === 0);
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Auditoría de influencers</h1>
        <p className="text-sm text-muted-foreground">
          Ratio rendido/recibido, denuncias y estado de revisión. Marca como
          <strong> sospechoso</strong> a los que reciben pero no rinden,
          o <strong>desactiva</strong> los confirmados como fraudulentos.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTROS.map((f) => (
          <Link
            key={f}
            href={`/admin/influencers?filtro=${f}${needle ? `&q=${encodeURIComponent(needle)}` : ''}`}
            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium ${
              filtro === f
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input hover:bg-accent'
            }`}
          >
            {f === 'todos' ? 'Todos' :
             f === 'ok' ? 'OK' :
             f === 'sospechoso' ? 'Sospechosos' :
             f === 'desactivado' ? 'Desactivados' :
             f === 'bajo_ratio' ? 'Ratio < 40%' : 'Sin rendir'}
          </Link>
        ))}
        <form className="ml-auto">
          <input type="hidden" name="filtro" value={filtro} />
          <input
            type="search" name="q" defaultValue={needle} placeholder="Buscar nombre…"
            className="w-48 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
        </form>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">{rows.length} influencers</p>

      {rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          Sin resultados para este filtro.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => <InfluencerAuditCard key={r.id} inf={r} />)}
        </div>
      )}
    </>
  );
}
