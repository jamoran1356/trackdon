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
  username: string;
  anonId: string;
  nombreReal: string | null;
  kycVerifiedAt: string | null;
  rol: AppRol;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol, nombre_mostrado, username, anon_id, nombre_real, kyc_verificado_at')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? null,
    nombre: perfil?.nombre_mostrado ?? null,
    username: perfil?.username ?? perfil?.anon_id ?? '',
    anonId: perfil?.anon_id ?? '',
    nombreReal: perfil?.nombre_real ?? null,
    kycVerifiedAt: perfil?.kyc_verificado_at ?? null,
    rol: (perfil?.rol as AppRol) ?? 'donante'
  };
}
