import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { authenticateApiKey, hasScope, checkRateLimit, logApiCall, type ApiKeyContext } from './api-keys';

const MAX_BODY_BYTES = 200 * 1024; // 200 KB hard limit
const DEFAULT_PER_MINUTE = 60;

export async function withApiKey(
  req: Request,
  scope: string,
  handler: (ctx: ApiKeyContext) => Promise<NextResponse> | NextResponse,
  options?: { perMinute?: number }
): Promise<NextResponse> {
  const startedAt = Date.now();
  const ctx = await authenticateApiKey(req);
  const ipHash = hashIp(req);
  const userAgent = req.headers.get('user-agent')?.slice(0, 200) ?? null;
  const ruta = new URL(req.url).pathname;

  if (!ctx) {
    const res = NextResponse.json(
      { error: 'API key inválida o faltante. Manda header x-api-key o Authorization: Bearer.' },
      { status: 401 }
    );
    void logApiCall({ apiKeyId: null, metodo: req.method, ruta, statusCode: 401, ipHash, userAgent, duracionMs: Date.now() - startedAt, error: 'unauthorized' });
    return res;
  }
  if (!hasScope(ctx, scope)) {
    const res = NextResponse.json(
      { error: `Esta API key no tiene el scope requerido: ${scope}` },
      { status: 403 }
    );
    void logApiCall({ apiKeyId: ctx.id, metodo: req.method, ruta, statusCode: 403, ipHash, userAgent, duracionMs: Date.now() - startedAt, error: `missing_scope:${scope}` });
    return res;
  }

  const rate = await checkRateLimit(ctx.id, options?.perMinute ?? DEFAULT_PER_MINUTE);
  if (!rate.ok) {
    const res = NextResponse.json(
      { error: 'Rate limit excedido. Intenta más tarde.', recent: rate.recent },
      { status: 429, headers: { 'retry-after': '60' } }
    );
    void logApiCall({ apiKeyId: ctx.id, metodo: req.method, ruta, statusCode: 429, ipHash, userAgent, duracionMs: Date.now() - startedAt, error: 'rate_limited' });
    return res;
  }

  let result: NextResponse;
  try {
    result = await handler(ctx);
  } catch (e) {
    console.error('[api]', ruta, (e as Error).message);
    result = NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }

  void logApiCall({
    apiKeyId: ctx.id,
    metodo: req.method,
    ruta,
    statusCode: result.status,
    ipHash,
    userAgent,
    duracionMs: Date.now() - startedAt
  });
  return result;
}

export function parsePagination(url: URL): { limit: number; offset: number } {
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20));
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0);
  return { limit, offset };
}

export async function readJsonBody<T = unknown>(req: Request): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    return { ok: false, error: `Body demasiado grande (>${MAX_BODY_BYTES} bytes).` };
  }
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) {
      return { ok: false, error: `Body demasiado grande (>${MAX_BODY_BYTES} bytes).` };
    }
    const data = JSON.parse(text) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'JSON inválido en el body.' };
  }
}

function hashIp(req: Request): string | null {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? null;
  if (!ip) return null;
  // Hash de la IP para no guardarla en claro
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}
