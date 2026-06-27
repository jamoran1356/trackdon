'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';

export type CentroState = { error?: string } | null;

const TIPOS = ['centro_acopio', 'fundacion', 'iglesia', 'otro'];

export async function registerCentro(_prev: CentroState, formData: FormData): Promise<CentroState> {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login?return_to=/registro-centro');
  }

  const nombre = String(formData.get('nombre') ?? '').trim();
  const tipo = String(formData.get('tipo') ?? 'centro_acopio');
  const direccion = String(formData.get('direccion') ?? '').trim() || null;
  const email_contacto = String(formData.get('email_contacto') ?? '').trim().toLowerCase() || null;
  const evento_id = String(formData.get('evento_id') ?? '').trim() || null;

  if (nombre.length < 3) return { error: 'Nombre muy corto.' };
  if (!TIPOS.includes(tipo)) return { error: 'Tipo inválido.' };
  if (email_contacto && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_contacto)) {
    return { error: 'Email inválido.' };
  }

  const admin = createSupabaseAdmin();

  // Evita registros duplicados por user
  const { data: existing } = await admin
    .from('responsables')
    .select('centro_id')
    .eq('usuario_auth_id', user.id)
    .limit(1)
    .maybeSingle();
  if (existing) {
    return { error: 'Ya estás registrado como responsable de un centro.' };
  }

  // Crear centro (activo=true; el validador lo audita en /admin/centros)
  const { data: centro, error: cErr } = await admin
    .from('centros_acopio')
    .insert({
      nombre, tipo, direccion, email_contacto, evento_id, activo: true,
      responsable_principal_id: null
    })
    .select('id')
    .single();
  if (cErr) {
    console.error('[registerCentro]', cErr.message);
    return { error: 'No pude registrar el centro.' };
  }

  // Crear el row de responsable que vincula user → centro
  const { data: resp, error: rErr } = await admin
    .from('responsables')
    .insert({
      centro_id: centro.id,
      usuario_auth_id: user.id,
      nombre: user.username,
      rol: 'admin'
    })
    .select('id')
    .single();
  if (rErr) {
    console.error('[registerCentro] responsable:', rErr.message);
    return { error: 'Centro creado pero no pude vincularte como responsable.' };
  }

  // Marcar al centro con el responsable principal
  await admin.from('centros_acopio').update({ responsable_principal_id: resp.id }).eq('id', centro.id);

  // Subir rol del user a centro_admin
  if (user.rol === 'donante') {
    await admin.from('perfiles').update({ rol: 'centro_admin' }).eq('id', user.id);
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard/centro');
}
