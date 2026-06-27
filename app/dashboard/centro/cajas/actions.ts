'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';

export type CentroCajaState = { error?: string; ok?: boolean } | null;

const TRANSICIONES: Record<string, string[]> = {
  sellada: ['recibida'],
  recibida: ['en_camion'],
  en_camion: ['en_via'],
  en_via: ['distribuida']
};

async function verifyCentroOwner(centroId: string, userId: string): Promise<boolean> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from('responsables')
    .select('id')
    .eq('centro_id', centroId)
    .eq('usuario_auth_id', userId)
    .maybeSingle();
  return !!data;
}

export async function cambiarEstado(_prev: CentroCajaState, formData: FormData): Promise<CentroCajaState> {
  try {
    const user = await getSessionUser();
    if (!user) return { error: 'No autenticado.' };

    const caja_id = String(formData.get('caja_id') ?? '');
    const estado_nuevo = String(formData.get('estado_nuevo') ?? '');
    const nota = String(formData.get('nota') ?? '').trim() || null;

    if (!caja_id || !estado_nuevo) return { error: 'Faltan datos.' };

    const admin = createSupabaseAdmin();
    const { data: caja } = await admin
      .from('cajas')
      .select('id, estado, centro_destino_id')
      .eq('id', caja_id)
      .maybeSingle();
    if (!caja) return { error: 'Caja no encontrada.' };
    if (!caja.centro_destino_id) return { error: 'Caja sin centro asignado.' };

    const isOwner = await verifyCentroOwner(caja.centro_destino_id, user.id);
    if (!isOwner && user.rol !== 'super_admin') return { error: 'No sos responsable de este centro.' };

    const allowed = TRANSICIONES[caja.estado] ?? [];
    if (!allowed.includes(estado_nuevo)) {
      return { error: `Transición no permitida: ${caja.estado} → ${estado_nuevo}` };
    }

    const { error } = await admin
      .from('cajas')
      .update({ estado: estado_nuevo })
      .eq('id', caja_id);
    if (error) return { error: error.message };

    if (nota) {
      // dejar la nota en caja_eventos del último evento (trigger ya creó el row)
      await admin
        .from('caja_eventos')
        .update({ nota })
        .eq('caja_id', caja_id)
        .eq('estado_nuevo', estado_nuevo)
        .order('creado_at', { ascending: false })
        .limit(1);
    }

    revalidatePath(`/dashboard/centro/cajas/${caja_id}`);
    revalidatePath('/dashboard/centro/cajas');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function distribuirConReceptor(_prev: CentroCajaState, formData: FormData): Promise<CentroCajaState> {
  try {
    const user = await getSessionUser();
    if (!user) return { error: 'No autenticado.' };

    const caja_id = String(formData.get('caja_id') ?? '');
    const receptor = String(formData.get('receptor_descripcion') ?? '').trim();
    if (!caja_id) return { error: 'Falta caja.' };
    if (!receptor) return { error: 'Describí al receptor final.' };

    const admin = createSupabaseAdmin();
    const { data: caja } = await admin
      .from('cajas')
      .select('id, estado, centro_destino_id')
      .eq('id', caja_id)
      .maybeSingle();
    if (!caja) return { error: 'Caja no encontrada.' };
    if (!caja.centro_destino_id) return { error: 'Sin centro.' };

    const isOwner = await verifyCentroOwner(caja.centro_destino_id, user.id);
    if (!isOwner && user.rol !== 'super_admin') return { error: 'No sos responsable de este centro.' };

    if (caja.estado !== 'en_via') {
      return { error: `Solo se puede marcar distribuida desde "en_via" (estado actual: ${caja.estado}).` };
    }

    const { error } = await admin
      .from('cajas')
      .update({ estado: 'distribuida', receptor_descripcion: receptor })
      .eq('id', caja_id);
    if (error) return { error: error.message };

    revalidatePath(`/dashboard/centro/cajas/${caja_id}`);
    revalidatePath('/dashboard/centro/cajas');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
