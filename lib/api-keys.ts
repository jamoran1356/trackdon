import crypto from 'node:crypto';
import { createSupabaseAdmin } from '@/lib/supabase/server';

export const VALID_SCOPES = [
  'read',                  // read-all (default)
  'read:cajas',
  'read:donaciones',
  'read:centros',
  'read:influencers',
  'read:eventos',
  'read:rendiciones',
  'read:feed'
];

export function generateApiKey(): { plain: string; prefix: string; hash: string } {
  const random = crypto.randomBytes(24).toString('base64url'); // 32 chars
  const plain = `tk_${random}`;
  const prefix = plain.slice(0, 11); // "tk_" + 8 chars visibles
  const hash = crypto.createHash('sha256').update(plain).digest('hex');
  return { plain, prefix, hash };
}

export interface ApiKeyContext {
  id: string;
  name: string;
  scopes: string[];
}

/**
 * Valida una API key del header `x-api-key` o `Authorization: Bearer <key>`.
 * Registra last_used_at + incrementa call_count.
 * Devuelve null si inválida/revocada/expirada.
 */
export async function authenticateApiKey(req: Request): Promise<ApiKeyContext | null> {
  let key = req.headers.get('x-api-key')?.trim();
  if (!key) {
    const auth = req.headers.get('authorization')?.trim();
    if (auth?.toLowerCase().startsWith('bearer ')) key = auth.slice(7).trim();
  }
  if (!key) return null;

  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from('api_keys')
    .select('id, name, scopes, revocada_at, expira_at')
    .eq('key_hash', hash)
    .maybeSingle();
  if (!data) return null;
  if (data.revocada_at) return null;
  if (data.expira_at && new Date(data.expira_at) < new Date()) return null;

  // fire-and-forget update
  admin.from('api_keys').update({
    last_used_at: new Date().toISOString(),
    call_count: undefined  // will use rpc-style approach below
  }).eq('id', data.id).then(() => {});
  // Increment call_count with raw sql in background
  admin.rpc('increment_api_key_calls', { p_id: data.id }).catch(() => {});

  return { id: data.id, name: data.name, scopes: data.scopes };
}

export function hasScope(ctx: ApiKeyContext, required: string): boolean {
  if (ctx.scopes.includes('read')) return true;
  return ctx.scopes.includes(required);
}
