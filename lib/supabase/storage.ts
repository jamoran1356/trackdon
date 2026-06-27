import crypto from 'node:crypto';
import { createSupabaseAdmin } from './server';

export type BucketId = 'avatares' | 'pruebas' | 'comprobantes' | 'denuncias';

export interface UploadResult {
  mediaId: string;
  bucket: BucketId;
  path: string;
  publicUrl?: string;
  hash: string;
  mimeType: string;
  size: number;
}

function ext(mime: string): string {
  switch (mime) {
    case 'image/jpeg': return '.jpg';
    case 'image/png': return '.png';
    case 'image/webp': return '.webp';
    case 'application/pdf': return '.pdf';
    default: return '';
  }
}

/**
 * Server-side upload. Computes sha256 of the file, uploads to Storage, and
 * registers a row in `medias` with the hash (the same value will be anchored
 * on-chain in Phase 2).
 *
 * `subidoPorAuthId` should be the authenticated user when available; pass
 * null for anonymous flows like /denunciar.
 */
export async function uploadFile(
  bucket: BucketId,
  file: File,
  options: { subidoPorAuthId?: string | null; pathPrefix?: string } = {}
): Promise<UploadResult> {
  const buf = Buffer.from(await file.arrayBuffer());
  const hash = crypto.createHash('sha256').update(buf).digest('hex');

  const isPrivate = bucket === 'comprobantes' || bucket === 'denuncias';
  const prefix = options.pathPrefix ? `${options.pathPrefix}/` : '';
  const filename = `${hash}${ext(file.type)}`;
  const path = `${prefix}${filename}`;

  const admin = createSupabaseAdmin();
  const { error: upErr } = await admin.storage
    .from(bucket)
    .upload(path, buf, {
      contentType: file.type,
      upsert: true,
      cacheControl: '3600'
    });
  if (upErr && !/already exists/i.test(upErr.message)) {
    throw new Error(`storage upload failed: ${upErr.message}`);
  }

  const { data: media, error: dbErr } = await admin
    .from('medias')
    .insert({
      bucket,
      path,
      hash_sha256: hash,
      mime_type: file.type,
      subido_por_auth_id: options.subidoPorAuthId ?? null,
      es_privado: isPrivate
    })
    .select('id')
    .single();
  if (dbErr) throw new Error(`media insert failed: ${dbErr.message}`);

  let publicUrl: string | undefined;
  if (!isPrivate) {
    const { data } = admin.storage.from(bucket).getPublicUrl(path);
    publicUrl = data.publicUrl;
  }

  return {
    mediaId: media.id as string,
    bucket,
    path,
    publicUrl,
    hash,
    mimeType: file.type,
    size: buf.length
  };
}

/** Signed URL for private buckets (≤ 5 min, default). */
export async function getSignedUrl(
  bucket: BucketId,
  path: string,
  expiresIn = 300
): Promise<string | null> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error || !data) return null;
  return data.signedUrl;
}
