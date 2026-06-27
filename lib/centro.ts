import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';

/**
 * Devuelve el primer centro del que el user es responsable.
 * super_admin necesita pasar centro_id explícito.
 */
export async function getMyCentroId(): Promise<string | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from('responsables')
    .select('centro_id')
    .eq('usuario_auth_id', user.id)
    .order('creado_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.centro_id ?? null;
}
