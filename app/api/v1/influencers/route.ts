import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { withApiKey, parsePagination } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return withApiKey(req, 'read:influencers', async () => {
    const url = new URL(req.url);
    const { limit, offset } = parsePagination(url);
    const admin = createSupabaseAdmin();
    const { data, count, error } = await admin
      .from('v_influencer_auditoria')
      .select('id, slug, nombre_publico, verificado_at, revision_estado, total_recibido_usd, total_rendido_usd, ratio_rendicion_pct, denuncias_count', { count: 'exact' })
      .range(offset, offset + limit - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: data ?? [], total: count ?? 0, limit, offset });
  });
}
