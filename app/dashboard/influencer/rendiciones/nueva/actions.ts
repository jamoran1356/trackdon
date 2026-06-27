'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { uploadFile } from '@/lib/supabase/storage';

export type RendicionState = { error?: string } | null;

const DESTINOS = new Set(['compra_insumos', 'transferencia_centro', 'entrega_directa', 'otro']);
const MAX = 10 * 1024 * 1024;

export async function crearRendicion(
  _prev: RendicionState,
  formData: FormData
): Promise<RendicionState> {
  const user = await getSessionUser();
  if (!user) redirect('/login?return_to=/dashboard/influencer/rendiciones/nueva');

  const admin = createSupabaseAdmin();
  const { data: inf } = await admin
    .from('influencers')
    .select('id')
    .eq('usuario_auth_id', user.id)
    .maybeSingle();
  if (!inf) {
    return { error: 'Antes de rendir, crea tu perfil de influencer en /influencers/nuevo.' };
  }

  const concepto = String(formData.get('concepto') ?? '').trim();
  const monto = Math.max(0, Number(String(formData.get('monto_usd') ?? '0').replace(',', '.')) || 0);
  const destino_tipo = String(formData.get('destino_tipo') ?? '').trim();

  if (!concepto || concepto.length < 3) return { error: 'Describe el gasto (mín 3 caracteres).' };
  if (monto <= 0) return { error: 'El monto en USD debe ser mayor a 0.' };
  if (!DESTINOS.has(destino_tipo)) return { error: 'Destino inválido.' };

  // Comprobante (recomendado pero no obligatorio en MVP)
  let comprobante_media_id: string | null = null;
  const f = formData.get('comprobante');
  if (f instanceof File && f.size > 0) {
    if (f.size > MAX) return { error: 'El comprobante excede 10 MB.' };
    try {
      const r = await uploadFile('comprobantes', f, {
        subidoPorAuthId: user.id,
        pathPrefix: `rendiciones/${user.id}`
      });
      comprobante_media_id = r.mediaId;
    } catch (e) {
      return { error: `No pude subir el comprobante: ${(e as Error).message}` };
    }
  }

  const { error } = await admin.from('rendiciones').insert({
    influencer_id: inf.id,
    concepto,
    monto_usd: monto,
    destino_tipo,
    comprobante_media_id
    // verificado_at queda NULL → pendiente
  });
  if (error) return { error: error.message };

  revalidatePath('/dashboard/influencer');
  revalidatePath('/publico');
  redirect('/dashboard/influencer');
}
