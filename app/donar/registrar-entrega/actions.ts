'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin, createSupabaseServer } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';

export type EntregaState = { error?: string } | null;

const TIPOS = new Set(['bienes', 'dinero_fiat']);

export async function crearEntrega(
  _prev: EntregaState,
  formData: FormData
): Promise<EntregaState> {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login?return_to=/donar/registrar-entrega');
  }

  const tipo = String(formData.get('tipo') ?? 'bienes');
  const evento_id = String(formData.get('evento_id') ?? '').trim();
  const centro_modo = String(formData.get('centro_modo') ?? 'existente'); // 'existente' | 'nuevo'
  const centro_id = String(formData.get('centro_id') ?? '').trim();
  const centro_nuevo_nombre = String(formData.get('centro_nuevo_nombre') ?? '').trim();
  const centro_nuevo_direccion = String(formData.get('centro_nuevo_direccion') ?? '').trim();
  const descripcion = String(formData.get('descripcion') ?? '').trim();
  const valor_raw = String(formData.get('valor_estimado_usd') ?? '0').trim();
  const valor_estimado_usd = Math.max(0, Number(valor_raw) || 0);

  if (!TIPOS.has(tipo)) return { error: 'Tipo inválido.' };
  if (!evento_id) return { error: 'Seleccioná un evento.' };
  if (!descripcion || descripcion.length < 3) {
    return { error: 'Describí qué donás (mín 3 caracteres).' };
  }

  const supabase = await createSupabaseServer();
  const admin = createSupabaseAdmin();

  // Resolve target center (or create a pending one).
  let centroTargetId: string | null = null;
  if (centro_modo === 'nuevo') {
    if (!centro_nuevo_nombre || centro_nuevo_nombre.length < 3) {
      return { error: 'El nombre del centro nuevo es obligatorio.' };
    }
    if (!centro_nuevo_direccion) {
      return { error: 'Indicá la dirección o punto de concentración del centro.' };
    }
    // Validador asignado: el primero del evento, o cualquiera.
    const { data: anyValidator } = await admin
      .from('validadores')
      .select('id')
      .eq('activo', true)
      .limit(1)
      .single();
    if (!anyValidator) {
      return { error: 'Todavía no hay validadores para este evento. Pedile a un admin que cree uno.' };
    }
    const { data: nuevoCentro, error: ce } = await admin
      .from('centros_acopio')
      .insert({
        nombre: centro_nuevo_nombre,
        tipo: 'fisico',
        validador_id: anyValidator.id,
        direccion: centro_nuevo_direccion,
        evento_id,
        activo: true
      })
      .select('id')
      .single();
    if (ce || !nuevoCentro) return { error: ce?.message ?? 'No pude crear el centro.' };
    centroTargetId = nuevoCentro.id;
  } else {
    if (!centro_id) return { error: 'Seleccioná un centro o agregá uno nuevo.' };
    centroTargetId = centro_id;
  }

  // Find or create donante row for this user.
  const { data: donanteExistente } = await admin
    .from('donantes')
    .select('id')
    .eq('usuario_auth_id', user.id)
    .maybeSingle();

  let donanteId: string;
  if (donanteExistente?.id) {
    donanteId = donanteExistente.id;
  } else {
    const { data: dn, error: dne } = await admin
      .from('donantes')
      .insert({
        usuario_auth_id: user.id,
        nombre_mostrado: user.nombre ?? user.email ?? 'Anónimo'
      })
      .select('id')
      .single();
    if (dne || !dn) return { error: dne?.message ?? 'No pude registrar tu donante.' };
    donanteId = dn.id;
  }

  // Create the donation.
  const { data: donacion, error: de } = await admin
    .from('donaciones')
    .insert({
      donante_id: donanteId,
      tipo,
      descripcion,
      valor_estimado_usd,
      centro_recibio_id: centroTargetId,
      evento_id,
      estado: 'pendiente'
    })
    .select('id')
    .single();
  if (de || !donacion) return { error: de?.message ?? 'No pude crear la donación.' };

  revalidatePath('/publico');
  revalidatePath(`/e`);
  redirect(`/donar/exito?id=${donacion.id}`);
}
