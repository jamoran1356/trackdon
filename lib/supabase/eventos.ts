import { createSupabaseServer } from './server';

export interface EventoStats {
  evento_id: string;
  slug: string;
  nombre: string;
  categoria: string;
  lugar: string | null;
  fecha_inicio: string | null;
  activo: boolean;
  total_donaciones_usd: number;
  cantidad_donaciones: number;
  centros_activos: number;
  influencers_activos: number;
  damnificados_registrados: number;
  total_rendido_usd: number;
}

export async function getEventosActivos(): Promise<EventoStats[]> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from('v_evento_stats')
    .select('*')
    .order('fecha_inicio', { ascending: false, nullsFirst: false });
  return (data ?? []) as EventoStats[];
}

export async function getEventoBySlug(slug: string) {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('v_evento_stats')
    .select('*')
    .ilike('slug', slug)
    .single();
  if (error || !data) return null;
  return data as EventoStats;
}

/** Lookup id by slug for use in queries.from('table').eq('evento_id', ...). */
export async function getEventoIdBySlug(slug: string): Promise<string | null> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from('eventos')
    .select('id')
    .ilike('slug', slug)
    .single();
  return data?.id ?? null;
}
