'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { uploadFile } from '@/lib/supabase/storage';

export type EntregaState = { error?: string } | null;

const TIPOS = new Set(['bienes', 'dinero_fiat']);
const MAX_COMPROBANTE = 10 * 1024 * 1024;

export async function crearEntrega(
  _prev: EntregaState,
  formData: FormData
): Promise<EntregaState> {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login?return_to=/donar/registrar-entrega');
  }

  const tipo = String(formData.get('tipo') ?? 'bienes');
  if (!TIPOS.has(tipo)) return { error: 'Tipo inválido.' };
  const isBienes = tipo === 'bienes';

  const evento_id = String(formData.get('evento_id') ?? '').trim();
  const descripcion = String(formData.get('descripcion') ?? '').trim();
  const valor_raw = String(formData.get('valor_estimado_usd') ?? '0').trim();
  const valor_estimado_usd = Math.max(0, Number(valor_raw) || 0);

  if (!evento_id) return { error: 'Seleccioná un evento.' };
  if (!descripcion || descripcion.length < 3) {
    return { error: 'Describí qué donaste (mín 3 caracteres).' };
  }
  if (!isBienes && valor_estimado_usd <= 0) {
    return { error: 'Indicá el monto transferido en USD.' };
  }

  const admin = createSupabaseAdmin();

  // Branch: bienes → centro; dinero_fiat → influencer.
  let centro_recibio_id: string | null = null;
  let influencer_recibio_id: string | null = null;

  if (isBienes) {
    const centro_modo = String(formData.get('centro_modo') ?? 'existente');
    if (centro_modo === 'nuevo') {
      const nombre = String(formData.get('centro_nuevo_nombre') ?? '').trim();
      const direccion = String(formData.get('centro_nuevo_direccion') ?? '').trim();
      if (!nombre || nombre.length < 3) return { error: 'El nombre del centro nuevo es obligatorio.' };
      if (!direccion) return { error: 'Indicá la dirección o punto de concentración del centro.' };

      const { data: anyValidator } = await admin
        .from('validadores')
        .select('id').eq('activo', true).limit(1).single();
      if (!anyValidator) return { error: 'Todavía no hay validadores. Pedile a un admin que cree uno.' };

      const { data: nuevoCentro, error: ce } = await admin
        .from('centros_acopio')
        .insert({
          nombre, tipo: 'fisico',
          validador_id: anyValidator.id,
          direccion, evento_id, activo: true
        })
        .select('id').single();
      if (ce || !nuevoCentro) return { error: ce?.message ?? 'No pude crear el centro.' };
      centro_recibio_id = nuevoCentro.id;
    } else {
      centro_recibio_id = String(formData.get('centro_id') ?? '').trim() || null;
      if (!centro_recibio_id) return { error: 'Seleccioná un centro o agregá uno nuevo.' };
    }
  } else {
    influencer_recibio_id = String(formData.get('influencer_id') ?? '').trim() || null;
    if (!influencer_recibio_id) return { error: 'Seleccioná un receptor.' };
  }

  // Comprobante (opcional para bienes, recomendado para transferencia)
  let comprobanteMediaId: string | null = null;
  const comprobante = formData.get('comprobante');
  if (comprobante instanceof File && comprobante.size > 0) {
    if (comprobante.size > MAX_COMPROBANTE) {
      return { error: 'El comprobante excede 10 MB.' };
    }
    try {
      const r = await uploadFile('comprobantes', comprobante, {
        subidoPorAuthId: user.id,
        pathPrefix: `donaciones/${user.id}`
      });
      comprobanteMediaId = r.mediaId;
    } catch (e) {
      return { error: `No pude subir el comprobante: ${(e as Error).message}` };
    }
  }

  // donante row
  const { data: dExist } = await admin
    .from('donantes')
    .select('id').eq('usuario_auth_id', user.id).maybeSingle();
  let donanteId: string;
  if (dExist?.id) donanteId = dExist.id;
  else {
    const { data: dn, error: dne } = await admin
      .from('donantes')
      .insert({
        usuario_auth_id: user.id,
        nombre_mostrado: user.nombre ?? user.email ?? 'Anónimo'
      })
      .select('id').single();
    if (dne || !dn) return { error: dne?.message ?? 'No pude registrar tu donante.' };
    donanteId = dn.id;
  }

  // Donación
  const descripcionFinal = comprobanteMediaId
    ? `${descripcion} · comprobante adjunto`
    : descripcion;
  const { data: donacion, error: de } = await admin
    .from('donaciones')
    .insert({
      donante_id: donanteId,
      tipo,
      descripcion: descripcionFinal,
      valor_estimado_usd,
      centro_recibio_id,
      influencer_recibio_id,
      evento_id,
      estado: 'recibida'
    })
    .select('id').single();
  if (de || !donacion) return { error: de?.message ?? 'No pude crear la donación.' };

  revalidatePath('/publico');
  revalidatePath('/e');
  if (influencer_recibio_id) revalidatePath(`/i`);
  redirect(`/donar/exito?id=${donacion.id}`);
}
