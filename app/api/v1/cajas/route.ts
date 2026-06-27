import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { withApiKey, parsePagination } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return withApiKey(req, 'read:cajas', async () => {
    const url = new URL(req.url);
    const { limit, offset } = parsePagination(url);
    const estado = url.searchParams.get('estado');

    const admin = createSupabaseAdmin();
    let q = admin
      .from('cajas')
      .select('id, codigo, titulo, estado, centro_destino_id, evento_id, creado_at, sellada_at, distribuida_at, receptor_descripcion', { count: 'exact' })
      .neq('estado', 'borrador')
      .order('creado_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (estado) q = q.eq('estado', estado);

    const { data, count, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: data ?? [], total: count ?? 0, limit, offset });
  });
}
