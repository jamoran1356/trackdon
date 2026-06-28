import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { withApiKey, parsePagination, readJsonBody } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return withApiKey(req, 'read:donaciones', async () => {
    const url = new URL(req.url);
    const { limit, offset } = parsePagination(url);
    const admin = createSupabaseAdmin();
    const { data, count, error } = await admin
      .from('donaciones')
      .select('id, tipo, descripcion, valor_estimado_usd, centro_recibio_id, influencer_recibio_id, evento_id, estado, creado_at, external_ref', { count: 'exact' })
      .order('creado_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: data ?? [], total: count ?? 0, limit, offset });
  });
}

const TIPOS = ['bienes', 'dinero_fiat'] as const;
const ESTADOS = ['recibida', 'rendida_parcial', 'rendida_total', 'observada'] as const;

const PostSchema = z.object({
  tipo: z.enum(TIPOS),
  descripcion: z.string().min(3).max(1000),
  valor_estimado_usd: z.number().nonnegative().max(10_000_000).optional().default(0),
  evento_slug: z.string().optional(),
  evento_id: z.string().uuid().optional(),
  centro_id: z.string().uuid().optional(),
  centro_slug: z.string().optional(),
  influencer_id: z.string().uuid().optional(),
  influencer_slug: z.string().optional(),
  donante_username: z.string().regex(/^[a-z0-9_-]{3,20}$/).optional(),
  external_ref: z.string().min(1).max(120).optional(),
  estado: z.enum(ESTADOS).optional().default('recibida')
});

export async function POST(req: Request) {
  return withApiKey(req, 'write:donaciones', async (ctx) => {
    const parsed = await readJsonBody(req);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const result = PostSchema.safeParse(parsed.data);
    if (!result.success) {
      return NextResponse.json({ error: 'Validación falló', issues: result.error.issues }, { status: 422 });
    }
    const input = result.data;

    if (!input.centro_id && !input.centro_slug && !input.influencer_id && !input.influencer_slug) {
      return NextResponse.json({ error: 'Indica receptor: centro_id|centro_slug|influencer_id|influencer_slug.' }, { status: 422 });
    }

    const admin = createSupabaseAdmin();

    // Idempotencia: misma api_key + external_ref → devolver existente
    if (input.external_ref) {
      const { data: existing } = await admin
        .from('donaciones')
        .select('id, estado, creado_at, external_ref')
        .eq('via_api_key_id', ctx.id)
        .eq('external_ref', input.external_ref)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ data: existing, idempotent: true }, { status: 200 });
      }
    }

    // Resolver evento
    let evento_id: string | null = input.evento_id ?? null;
    if (!evento_id && input.evento_slug) {
      const { data: ev } = await admin.from('eventos').select('id').eq('slug', input.evento_slug).maybeSingle();
      if (!ev) return NextResponse.json({ error: `Evento '${input.evento_slug}' no encontrado.` }, { status: 404 });
      evento_id = ev.id;
    }

    // Resolver receptor
    let centro_recibio_id: string | null = input.centro_id ?? null;
    let influencer_recibio_id: string | null = input.influencer_id ?? null;

    if (!centro_recibio_id && input.centro_slug) {
      const { data: c } = await admin.from('centros_acopio').select('id').eq('id', input.centro_slug).maybeSingle();
      centro_recibio_id = c?.id ?? null;
    }
    if (!influencer_recibio_id && input.influencer_slug) {
      const { data: i } = await admin.from('influencers').select('id').eq('slug', input.influencer_slug).maybeSingle();
      if (!i) return NextResponse.json({ error: `Influencer '${input.influencer_slug}' no encontrado.` }, { status: 404 });
      influencer_recibio_id = i.id;
    }

    // Resolver donante (opcional)
    let donante_id: string | null = null;
    if (input.donante_username) {
      const { data: p } = await admin.from('perfiles').select('id').ilike('username', input.donante_username).maybeSingle();
      if (p) {
        const { data: d } = await admin.from('donantes').select('id').eq('usuario_auth_id', p.id).maybeSingle();
        donante_id = d?.id ?? null;
        if (!donante_id) {
          const { data: dn } = await admin.from('donantes').insert({
            usuario_auth_id: p.id, nombre_mostrado: input.donante_username
          }).select('id').single();
          donante_id = dn?.id ?? null;
        }
      }
    }

    // Crear donación
    const { data: donacion, error: insErr } = await admin.from('donaciones').insert({
      donante_id,
      tipo: input.tipo,
      descripcion: input.descripcion,
      valor_estimado_usd: input.valor_estimado_usd,
      centro_recibio_id,
      influencer_recibio_id,
      evento_id,
      estado: input.estado,
      external_ref: input.external_ref ?? null,
      via_api_key_id: ctx.id,
      creado_via_api_at: new Date().toISOString()
    }).select('id, tipo, estado, valor_estimado_usd, creado_at, external_ref').single();

    if (insErr) {
      console.error('[api] post donaciones insert:', insErr.message);
      return NextResponse.json({ error: 'No se pudo registrar la donación.' }, { status: 500 });
    }

    return NextResponse.json({ data: donacion }, { status: 201 });
  }, { perMinute: 30 });
}
