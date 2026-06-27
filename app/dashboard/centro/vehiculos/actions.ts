'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';

export type Result = { error?: string; ok?: boolean } | null;

async function ownsCentro(userId: string, centroId: string): Promise<boolean> {
  const admin = createSupabaseAdmin();
  const { data } = await admin.from('responsables')
    .select('id').eq('centro_id', centroId).eq('usuario_auth_id', userId).maybeSingle();
  return !!data;
}

export async function addVehiculo(_prev: Result, formData: FormData): Promise<Result> {
  try {
    const user = await getSessionUser();
    if (!user) return { error: 'No autenticado.' };
    const centro_id = String(formData.get('centro_id') ?? '');
    if (!centro_id) return { error: 'Falta centro.' };
    if (!(await ownsCentro(user.id, centro_id)) && user.rol !== 'super_admin') {
      return { error: 'No sos responsable de ese centro.' };
    }

    const identificador = String(formData.get('identificador') ?? '').trim();
    const marca = String(formData.get('marca') ?? '').trim() || null;
    const modelo = String(formData.get('modelo') ?? '').trim() || null;
    const placa = String(formData.get('placa') ?? '').trim() || null;
    const capacidad_kg = parseFloat(String(formData.get('capacidad_kg') ?? '0')) || null;

    if (!identificador) return { error: 'Identificador es obligatorio.' };

    const admin = createSupabaseAdmin();
    const { error } = await admin.from('centros_camiones').insert({
      centro_id, identificador, marca, modelo, placa, capacidad_kg
    });
    if (error) return { error: error.message };

    revalidatePath('/dashboard/centro/vehiculos');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function setVehiculoEstado(_prev: Result, formData: FormData): Promise<Result> {
  try {
    const user = await getSessionUser();
    if (!user) return { error: 'No autenticado.' };
    const id = String(formData.get('id') ?? '');
    const estado = String(formData.get('estado') ?? '');
    const ALLOWED = ['disponible','cargando','en_ruta','descargando','mantenimiento'];
    if (!ALLOWED.includes(estado)) return { error: 'Estado inválido.' };

    const admin = createSupabaseAdmin();
    const { data: v } = await admin.from('centros_camiones').select('centro_id').eq('id', id).maybeSingle();
    if (!v) return { error: 'Vehículo no encontrado.' };
    if (!(await ownsCentro(user.id, v.centro_id)) && user.rol !== 'super_admin') {
      return { error: 'No autorizado.' };
    }

    await admin.from('centros_camiones').update({ estado }).eq('id', id);
    revalidatePath('/dashboard/centro/vehiculos');
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
