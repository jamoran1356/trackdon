import { createSupabaseServer } from './server';

export async function getMyInfluencer(userId: string) {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from('influencers')
    .select(`
      id, slug, nombre_publico, bio, avatar_url,
      twitter_handle, instagram_handle, tiktok_handle, youtube_handle, website_url,
      verificado_at, rechazado_at, rechazado_motivo,
      activo, evento_id
    `)
    .eq('usuario_auth_id', userId)
    .maybeSingle();
  return data;
}

export async function getInfluencerRollup(influencerId: string) {
  const supabase = await createSupabaseServer();
  const [{ data: don }, { data: rendOk }, { data: rendPend }, { data: rendiciones }] = await Promise.all([
    supabase.from('donaciones').select('valor_estimado_usd').eq('influencer_recibio_id', influencerId),
    supabase.from('rendiciones').select('monto_usd').eq('influencer_id', influencerId).not('verificado_at', 'is', null),
    supabase.from('rendiciones').select('monto_usd').eq('influencer_id', influencerId).is('verificado_at', null).is('rechazado_at', null),
    supabase
      .from('rendiciones')
      .select('id, concepto, monto_usd, destino_tipo, verificado_at, rechazado_at, creado_at')
      .eq('influencer_id', influencerId)
      .order('creado_at', { ascending: false })
      .limit(20)
  ]);

  const recibido = (don ?? []).reduce((s, r) => s + Number(r.valor_estimado_usd ?? 0), 0);
  const entregado = (rendOk ?? []).reduce((s, r) => s + Number(r.monto_usd ?? 0), 0);
  const pendiente = (rendPend ?? []).reduce((s, r) => s + Number(r.monto_usd ?? 0), 0);

  return {
    recibido,
    entregado,
    pendiente_verif: pendiente,
    rendiciones: rendiciones ?? []
  };
}

export async function getMyCentros(userId: string) {
  const supabase = await createSupabaseServer();
  // Centros where the user is either responsable or admin of the validador.
  const { data: viaResponsable } = await supabase
    .from('responsables')
    .select('centro_id, centros_acopio(*)')
    .eq('usuario_auth_id', userId);
  return (viaResponsable ?? []).map((r: any) => r.centros_acopio).filter(Boolean);
}

export async function getCentroRollup(centroId: string) {
  const supabase = await createSupabaseServer();
  const [{ data: donaciones }, { data: custodias }] = await Promise.all([
    supabase
      .from('donaciones')
      .select('id, descripcion, valor_estimado_usd, estado, creado_at, donante:donantes(nombre_mostrado)')
      .eq('centro_recibio_id', centroId)
      .order('creado_at', { ascending: false })
      .limit(10),
    supabase
      .from('custodias')
      .select('id, recibido_at, notas')
      .eq('centro_id', centroId)
      .order('recibido_at', { ascending: false })
      .limit(10)
  ]);
  return { donaciones: donaciones ?? [], custodias: custodias ?? [] };
}
