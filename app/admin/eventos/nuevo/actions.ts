'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';

export type EventoState = { error?: string } | null;

const CATEGORIAS = new Set([
  'terremoto', 'inundacion', 'huracan', 'incendio', 'conflicto', 'crisis_humanitaria', 'otro'
]);

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
    .slice(0, 64);
}

export async function crearEvento(
  _prev: EventoState,
  formData: FormData
): Promise<EventoState> {
  const user = await getSessionUser();
  if (!user || user.rol !== 'super_admin') {
    return { error: 'Solo super_admin puede crear eventos.' };
  }

  const nombre = String(formData.get('nombre') ?? '').trim();
  const slugRaw = String(formData.get('slug') ?? '').trim();
  const descripcion = String(formData.get('descripcion') ?? '').trim() || null;
  const lugar = String(formData.get('lugar') ?? '').trim() || null;
  const categoria = String(formData.get('categoria') ?? '').trim();
  const fecha_inicio = String(formData.get('fecha_inicio') ?? '').trim() || null;
  const banner_url = String(formData.get('banner_url') ?? '').trim() || null;

  if (!nombre || nombre.length < 3) return { error: 'El nombre es obligatorio (mín 3 caracteres).' };
  if (!CATEGORIAS.has(categoria)) return { error: 'Categoría inválida.' };
  const slug = slugRaw ? slugify(slugRaw) : slugify(nombre);
  if (!slug) return { error: 'No se pudo generar slug. Usa un nombre con letras.' };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.from('eventos').insert({
    nombre,
    slug,
    descripcion,
    lugar,
    categoria,
    fecha_inicio,
    banner_url,
    creado_por_auth_id: user.id
  });
  if (error) return { error: error.message };

  revalidatePath('/admin/eventos');
  revalidatePath('/publico');
  redirect('/admin/eventos');
}
