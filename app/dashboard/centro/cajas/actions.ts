'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { uploadFile } from '@/lib/supabase/storage';

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

    // Si es transición a "recibida" → registrar acuso de recibo con foto + personal opcionales
    if (estado_nuevo === 'recibida') {
      const foto = formData.get('foto') as File | null;
      const personal_id = String(formData.get('personal_id') ?? '') || null;
      const acuso_nota = nota;

      let foto_media_id: string | null = null;
      if (foto && typeof foto === 'object' && foto.size > 0) {
        if (foto.size > 10 * 1024 * 1024) return { error: 'Foto demasiado grande (máx 10 MB).' };
        try {
          const up = await uploadFile('pruebas', foto, { subidoPorAuthId: user.id, pathPrefix: `acusos/${caja_id}/recibo` });
          foto_media_id = up.mediaId;
        } catch (e) {
          console.error('[cambiarEstado] upload foto recibo:', (e as Error).message);
        }
      }

      await admin.from('caja_acusos').insert({
        caja_id, tipo: 'recibo',
        foto_media_id, firmado_por_personal_id: personal_id,
        firmado_por_auth_id: user.id, notas: acuso_nota
      });
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

    const foto = formData.get('foto') as File | null;
    const personal_id = String(formData.get('personal_id') ?? '') || null;
    const notas = String(formData.get('notas') ?? '').trim() || null;

    let foto_media_id: string | null = null;
    if (foto && typeof foto === 'object' && foto.size > 0) {
      if (foto.size > 10 * 1024 * 1024) return { error: 'Foto demasiado grande (máx 10 MB).' };
      try {
        const up = await uploadFile('pruebas', foto, { subidoPorAuthId: user.id, pathPrefix: `acusos/${caja_id}/entrega` });
        foto_media_id = up.mediaId;
      } catch (e) {
        console.error('[distribuirConReceptor] upload foto:', (e as Error).message);
      }
    }

    const { error } = await admin
      .from('cajas')
      .update({
        estado: 'distribuida',
        receptor_descripcion: receptor,
        receptor_evidencia_media_id: foto_media_id ?? undefined
      })
      .eq('id', caja_id);
    if (error) return { error: error.message };

    await admin.from('caja_acusos').insert({
      caja_id, tipo: 'entrega',
      foto_media_id, firmado_por_personal_id: personal_id,
      firmado_por_auth_id: user.id, notas
    });

    revalidatePath(`/dashboard/centro/cajas/${caja_id}`);
    revalidatePath('/dashboard/centro/cajas');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
