import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { CajaDetalle } from './detalle';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Caja ${id.slice(0, 8)}` };
}

export default async function CajaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const admin = createSupabaseAdmin();
  const { data: caja } = await admin
    .from('cajas')
    .select('id, codigo, titulo, estado, donante_auth_id, centro_destino_id, evento_id, creado_at, sellada_at, recibida_at, en_camion_at, en_via_at, distribuida_at, receptor_descripcion')
    .eq('id', id)
    .maybeSingle();
  if (!caja) notFound();
  if (caja.donante_auth_id !== user.id) redirect('/dashboard/cajas');

  const [{ data: items }, { data: centros }, { data: eventos }] = await Promise.all([
    admin.from('caja_items').select('id, descripcion, cantidad, unidad, subcategoria, notas').eq('caja_id', id).order('creado_at', { ascending: true }),
    admin.from('centros_acopio').select('id, nombre, evento_id').eq('activo', true),
    admin.from('eventos').select('id, nombre').eq('activo', true)
  ]);

  return (
    <CajaDetalle
      caja={caja}
      items={(items ?? []) as { id: string; descripcion: string; cantidad: number; unidad: string; subcategoria: string | null; notas: string | null }[]}
      centros={(centros ?? []) as { id: string; nombre: string; evento_id: string | null }[]}
      eventos={(eventos ?? []) as { id: string; nombre: string }[]}
    />
  );
}
