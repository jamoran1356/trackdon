import { createSupabaseServer } from './supabase/server';

export type AppRol =
  | 'donante'
  | 'centro_admin'
  | 'centro_responsable'
  | 'influencer'
  | 'validador'
  | 'super_admin';

export interface SessionUser {
  id: string;
  email: string | null;
  nombre: string | null;
  rol: AppRol;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol, nombre_mostrado')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? null,
    nombre: perfil?.nombre_mostrado ?? null,
    rol: (perfil?.rol as AppRol) ?? 'donante'
  };
}
