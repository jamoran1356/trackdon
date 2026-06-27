import { NextResponse } from 'next/server';
import { authenticateApiKey, hasScope, type ApiKeyContext } from './api-keys';

export async function withApiKey(
  req: Request,
  scope: string,
  handler: (ctx: ApiKeyContext) => Promise<NextResponse> | NextResponse
): Promise<NextResponse> {
  const ctx = await authenticateApiKey(req);
  if (!ctx) {
    return NextResponse.json(
      { error: 'API key inválida o faltante. Manda header x-api-key o Authorization: Bearer.' },
      { status: 401 }
    );
  }
  if (!hasScope(ctx, scope)) {
    return NextResponse.json(
      { error: `Esta API key no tiene el scope requerido: ${scope}` },
      { status: 403 }
    );
  }
  return handler(ctx);
}

export function parsePagination(url: URL): { limit: number; offset: number } {
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20));
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0);
  return { limit, offset };
}
