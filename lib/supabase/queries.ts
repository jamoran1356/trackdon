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
      influencer:influencers(nombre_publico)
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

/** Active influencers with received/rendered roll-up. */
export async function getInfluencersConRendicion(limit = 10) {
  const supabase = await createSupabaseServer();
  const { data: influencers, error } = await supabase
    .from('influencers')
    .select('id, nombre_publico')
    .eq('activo', true)
    .limit(limit);
  if (error || !influencers) return { data: [], error: error?.message ?? null };

  // For each influencer, sum received (donaciones to them) and rendered (rendiciones).
  const enriched = await Promise.all(
    influencers.map(async (i) => {
      const [{ data: recv }, { data: rend }] = await Promise.all([
        supabase
          .from('donaciones')
          .select('valor_estimado_usd')
          .eq('influencer_recibio_id', i.id),
        supabase
          .from('rendiciones')
          .select('monto_usd')
          .eq('influencer_id', i.id)
      ]);
      const recibido = (recv ?? []).reduce((s, r) => s + Number(r.valor_estimado_usd ?? 0), 0);
      const rendido = (rend ?? []).reduce((s, r) => s + Number(r.monto_usd ?? 0), 0);
      return {
        id: i.id,
        nombre: i.nombre_publico,
        recibido,
        rendido,
        pendiente: Math.max(recibido - rendido, 0)
      };
    })
  );

  return { data: enriched, error: null as string | null };
}
