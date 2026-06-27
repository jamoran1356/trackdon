import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type FeedItem = {
  id: string;
  kind: 'donacion' | 'distribucion' | 'rendicion' | 'denuncia' | 'influencer_verificado' | 'centro_nuevo';
  ts: string;
  title: string;
  subtitle: string;
  href?: string;
};

export async function GET() {
  const admin = createSupabaseAdmin();

  const [donaciones, distribuciones, rendiciones, denuncias, influencers, centros] = await Promise.all([
    admin.from('donaciones').select('id, descripcion, tipo, valor_estimado_usd, creado_at').order('creado_at', { ascending: false }).limit(12),
    admin.from('distribuciones').select('id, monto_o_descripcion, poblacion_destino, beneficiarios_cantidad, entregado_at, creado_at').order('creado_at', { ascending: false }).limit(12),
    admin.from('rendiciones').select('id, concepto, monto_usd, verificado_at, creado_at').order('creado_at', { ascending: false }).limit(12),
    admin.from('denuncias').select('id, tipo, descripcion, estado, creado_at').order('creado_at', { ascending: false }).limit(12),
    admin.from('influencers').select('id, nombre_publico, slug, verificado_at').not('verificado_at', 'is', null).order('verificado_at', { ascending: false }).limit(12),
    admin.from('centros_acopio').select('id, nombre, tipo, creado_at').order('creado_at', { ascending: false }).limit(12)
  ]);

  type DonRow = { id: string; descripcion: string | null; tipo: string; valor_estimado_usd: number | null; creado_at: string };
  type DistRow = { id: string; monto_o_descripcion: string | null; poblacion_destino: string | null; beneficiarios_cantidad: number | null; entregado_at: string | null; creado_at: string };
  type RendRow = { id: string; concepto: string; monto_usd: number | null; verificado_at: string | null; creado_at: string };
  type DenRow = { id: string; tipo: string; descripcion: string | null; estado: string; creado_at: string };
  type InfRow = { id: string; nombre_publico: string; slug: string; verificado_at: string | null };
  type CenRow = { id: string; nombre: string; tipo: string; creado_at: string };

  const items: FeedItem[] = [
    ...((donaciones.data ?? []) as DonRow[]).map((d) => ({
      id: `don-${d.id}`,
      kind: 'donacion' as const,
      ts: d.creado_at,
      title: d.descripcion ?? `Donación ${d.tipo}`,
      subtitle: d.valor_estimado_usd ? `≈ US$ ${d.valor_estimado_usd}` : `tipo: ${d.tipo}`,
      href: '/publico'
    })),
    ...((distribuciones.data ?? []) as DistRow[]).map((d) => ({
      id: `dist-${d.id}`,
      kind: 'distribucion' as const,
      ts: (d.entregado_at ?? d.creado_at) as string,
      title: d.monto_o_descripcion ?? 'Entrega registrada',
      subtitle: [d.poblacion_destino, d.beneficiarios_cantidad && `${d.beneficiarios_cantidad} beneficiarios`].filter(Boolean).join(' · ') || 'distribución'
    })),
    ...((rendiciones.data ?? []) as RendRow[]).filter((r) => r.verificado_at).map((r) => ({
      id: `rend-${r.id}`,
      kind: 'rendicion' as const,
      ts: r.verificado_at as string,
      title: r.concepto,
      subtitle: r.monto_usd ? `US$ ${r.monto_usd} verificado` : 'rendición verificada'
    })),
    ...((denuncias.data ?? []) as DenRow[]).map((d) => ({
      id: `den-${d.id}`,
      kind: 'denuncia' as const,
      ts: d.creado_at,
      title: `Denuncia: ${d.tipo}`,
      subtitle: (d.descripcion ?? '').slice(0, 80) + ((d.descripcion ?? '').length > 80 ? '…' : '')
    })),
    ...((influencers.data ?? []) as InfRow[]).map((i) => ({
      id: `inf-${i.id}`,
      kind: 'influencer_verificado' as const,
      ts: i.verificado_at as string,
      title: `${i.nombre_publico} verificado`,
      subtitle: `Influencer /${i.slug}`,
      href: `/i/${i.slug}`
    })),
    ...((centros.data ?? []) as CenRow[]).map((c) => ({
      id: `cen-${c.id}`,
      kind: 'centro_nuevo' as const,
      ts: c.creado_at,
      title: `Nuevo centro: ${c.nombre}`,
      subtitle: `tipo ${c.tipo}`
    }))
  ];

  items.sort((a, b) => +new Date(b.ts) - +new Date(a.ts));
  return NextResponse.json({ items: items.slice(0, 12) }, {
    headers: { 'cache-control': 'no-store' }
  });
}
