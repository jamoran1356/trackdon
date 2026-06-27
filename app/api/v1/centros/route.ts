import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { withApiKey, parsePagination } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return withApiKey(req, 'read:centros', async () => {
    const url = new URL(req.url);
    const { limit, offset } = parsePagination(url);
    const admin = createSupabaseAdmin();
    const { data, count, error } = await admin
      .from('centros_acopio')
      .select('id, nombre, tipo, direccion, email_contacto, evento_id, activo, creado_at', { count: 'exact' })
      .eq('activo', true)
      .order('creado_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: data ?? [], total: count ?? 0, limit, offset });
  });
}
