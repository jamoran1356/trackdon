import { createSupabaseServer } from './server';

/** Aggregated totals shown on /publico. Reads the sanitized public view. */
export async function getTotalesPublico() {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('v_totales_publico')
    .select('*')
    .single();

  if (error) {
    return {
      total_donaciones_usd: 0,
      cantidad_donaciones: 0,
      centros_activos: 0,
      influencers_activos: 0,
      damnificados_registrados: 0,
      total_rendido_usd: 0,
      total_pendiente_verif_usd: 0,
      _error: error.message
    };
  }
  return { ...data, _error: null as string | null };
}

/** Recent donations for the public board (no PII). */
export async function getDonacionesRecientes(limit = 10) {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('donaciones')
    .select(`
      id,
      tipo,
      descripcion,
      valor_estimado_usd,
      estado,
      creado_at,
      donante:donantes(nombre_mostrado),
      centro:centros_acopio(nombre),
      influencer:influencers(nombre_publico, slug)
    `)
    .order('creado_at', { ascending: false })
    .limit(limit);
  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null as string | null };
}

/** Active collection centers with item count rough estimate. */
export async function getCentrosActivos(limit = 10) {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('centros_acopio')
    .select('id, nombre, tipo, creado_at')
    .eq('activo', true)
    .order('creado_at', { ascending: false })
    .limit(limit);
  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null as string | null };
}

/** Active influencers with received vs verified delivered rollup. */
export async function getInfluencersConRendicion(limit = 10) {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('v_influencer_perfil')
    .select('id, slug, nombre_publico, recibido_usd, entregado_usd, pendiente_verif_usd')
    .limit(limit);
  if (error) return { data: [], error: error.message };
  return {
    data: (data ?? []).map((i: any) => ({
      id: i.id,
      slug: i.slug as string | null,
      nombre: i.nombre_publico,
      recibido: Number(i.recibido_usd ?? 0),
      entregado: Number(i.entregado_usd ?? 0),
      pendiente_verif: Number(i.pendiente_verif_usd ?? 0)
    })),
    error: null as string | null
  };
}

/** Public influencer profile by slug. */
export async function getInfluencerBySlug(slug: string) {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('v_influencer_perfil')
    .select('*')
    .ilike('slug', slug)
    .single();
  if (error || !data) return { data: null, error: error?.message ?? 'not_found' };
  return { data, error: null as string | null };
}

/** Verified renderings of a given influencer (with validator name). */
export async function getRendicionesVerificadasInfluencer(influencerId: string) {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('v_rendiciones_publico')
    .select('id, concepto, monto_usd, destino_tipo, verificado_at, verificado_por, creado_at')
    .eq('influencer_id', influencerId)
    .order('verificado_at', { ascending: false });
  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null as string | null };
}
