'use server';

import { redirect } from 'next/navigation';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { uploadFile } from '@/lib/supabase/storage';

export type DenunciaState = { error?: string; ok?: boolean } | null;

const TIPOS = new Set([
  'contra_centro',
  'contra_influencer',
  'contra_responsable',
  'irregularidad_general'
]);

const MAX_DESC = 4000;
const MAX_ATTACHMENTS = 3;
const MAX_SIZE = 10 * 1024 * 1024;

export async function crearDenuncia(
  _prev: DenunciaState,
  formData: FormData
): Promise<DenunciaState> {
  const tipo = String(formData.get('tipo') ?? '').trim();
  const descripcion = String(formData.get('descripcion') ?? '').trim();
  const reporter_nombre = String(formData.get('reporter_nombre') ?? '').trim() || null;
  const reporter_email = String(formData.get('reporter_email') ?? '').trim() || null;
  const target = String(formData.get('target_id') ?? '').trim() || null;

  if (!TIPOS.has(tipo)) return { error: 'Tipo de denuncia inválido.' };
  if (!descripcion || descripcion.length < 20) {
    return { error: 'La descripción debe tener al menos 20 caracteres.' };
  }
  if (descripcion.length > MAX_DESC) {
    return { error: `La descripción excede ${MAX_DESC} caracteres.` };
  }

  const adjuntos: File[] = [];
  for (const entry of formData.getAll('adjuntos')) {
    if (entry instanceof File && entry.size > 0) adjuntos.push(entry);
  }
  if (adjuntos.length > MAX_ATTACHMENTS) {
    return { error: `Máximo ${MAX_ATTACHMENTS} adjuntos.` };
  }
  for (const f of adjuntos) {
    if (f.size > MAX_SIZE) return { error: `${f.name} excede 10 MB.` };
  }

  const adjuntosMediaIds: string[] = [];
  for (const f of adjuntos) {
    try {
      const r = await uploadFile('denuncias', f, { pathPrefix: 'incoming' });
      adjuntosMediaIds.push(r.mediaId);
    } catch (e) {
      return { error: `Fallo subiendo adjunto: ${(e as Error).message}` };
    }
  }

  const payload: Record<string, unknown> = {
    tipo,
    descripcion,
    reporter_nombre,
    reporter_email,
    adjuntos_media_ids: adjuntosMediaIds
  };
  if (tipo === 'contra_centro' && target) payload.target_centro_id = target;
  if (tipo === 'contra_influencer' && target) payload.target_influencer_id = target;
  if (tipo === 'contra_responsable' && target) payload.target_responsable_id = target;

  const admin = createSupabaseAdmin();
  const { error } = await admin.from('denuncias').insert(payload);
  if (error) return { error: error.message };

  redirect('/denunciar/gracias');
}
