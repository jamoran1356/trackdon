import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatUsd } from '@/lib/utils';
import {
  verificarInfluencer,
  rechazarInfluencer,
  verificarRendicion,
  rechazarRendicion,
  marcarDenuncia
} from './actions';
import { CheckCircle2, XCircle, FileText, MegaphoneOff } from 'lucide-react';

export const metadata = { title: 'Panel validador' };

export default async function ValidadorPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?return_to=/dashboard/validador');
  if (!['validador', 'super_admin'].includes(user.rol)) redirect('/dashboard');

  const supabase = await createSupabaseServer();
  const [influencersPend, rendicionesPend, denunciasNuevas] = await Promise.all([
    supabase
      .from('influencers')
      .select('id, nombre_publico, slug, bio, twitter_handle, instagram_handle, creado_at')
      .is('verificado_at', null)
      .is('rechazado_at', null)
      .eq('activo', true)
      .order('creado_at', { ascending: true }),
    supabase
      .from('rendiciones')
      .select('id, concepto, monto_usd, destino_tipo, comprobante_media_id, creado_at, influencer:influencers(nombre_publico, slug)')
      .is('verificado_at', null)
      .is('rechazado_at', null)
      .order('creado_at', { ascending: true }),
    supabase
      .from('denuncias')
      .select('id, tipo, descripcion, estado, creado_at, target_centro_id, target_influencer_id')
      .in('estado', ['nueva', 'en_revision'])
      .order('creado_at', { ascending: true })
  ]);

  const infs = influencersPend.data ?? [];
  const rends = rendicionesPend.data ?? [];
  const den = denunciasNuevas.data ?? [];

  return (
    <>
      <div className="mb-6">
        <Badge variant="outline" className="mb-2">Validador</Badge>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Cola de verificación</h1>
        <p className="text-sm text-muted-foreground">
          {infs.length} influencer(s) por verificar · {rends.length} rendición(es) por verificar · {den.length} denuncia(s) abiertas.
        </p>
      </div>

      {/* Influencers pendientes */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Influencers pendientes</h2>
        {infs.length === 0 ? (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">Nada pendiente.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {infs.map((i: any) => (
              <Card key={i.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold">{i.nombre_publico}</p>
                      <p className="text-xs text-muted-foreground">/i/{i.slug}</p>
                      {i.bio && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{i.bio}</p>}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {i.twitter_handle && <Badge variant="outline">X: @{i.twitter_handle}</Badge>}
                        {i.instagram_handle && <Badge variant="outline">IG: @{i.instagram_handle}</Badge>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action={verificarInfluencer}>
                        <input type="hidden" name="id" value={i.id} />
                        <Button type="submit" size="sm" variant="default">
                          <CheckCircle2 className="h-4 w-4" /> Verificar
                        </Button>
                      </form>
                      <form action={rechazarInfluencer} className="flex gap-2">
                        <input type="hidden" name="id" value={i.id} />
                        <input
                          name="motivo"
                          placeholder="Motivo del rechazo"
                          className="h-9 rounded-md border border-input bg-background px-3 text-xs"
                        />
                        <Button type="submit" size="sm" variant="outline">
                          <XCircle className="h-4 w-4" /> Rechazar
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Rendiciones pendientes */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Rendiciones pendientes</h2>
        {rends.length === 0 ? (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">Nada pendiente.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {rends.map((r: any) => (
              <Card key={r.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-medium">{r.concepto}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.influencer?.nombre_publico ?? '—'} · {r.destino_tipo}
                      </p>
                      <p className="mt-1 font-mono text-sm">{formatUsd(Number(r.monto_usd ?? 0))}</p>
                      {r.comprobante_media_id ? (
                        <p className="mt-1 text-xs text-primary inline-flex items-center gap-1">
                          <FileText className="h-3 w-3" /> Comprobante adjunto
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Sin comprobante</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action={verificarRendicion}>
                        <input type="hidden" name="id" value={r.id} />
                        <Button type="submit" size="sm">
                          <CheckCircle2 className="h-4 w-4" /> Verificar
                        </Button>
                      </form>
                      <form action={rechazarRendicion} className="flex gap-2">
                        <input type="hidden" name="id" value={r.id} />
                        <input
                          name="motivo"
                          placeholder="Motivo del rechazo"
                          className="h-9 rounded-md border border-input bg-background px-3 text-xs"
                        />
                        <Button type="submit" size="sm" variant="outline">
                          <XCircle className="h-4 w-4" /> Rechazar
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Denuncias */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Denuncias</h2>
        {den.length === 0 ? (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">Sin denuncias abiertas.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {den.map((d: any) => (
              <Card key={d.id}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <MegaphoneOff className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{d.tipo}</Badge>
                        <Badge variant="warning">{d.estado}</Badge>
                      </div>
                      <p className="mt-2 text-sm">{d.descripcion}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <form action={marcarDenuncia} className="flex gap-2">
                      <input type="hidden" name="id" value={d.id} />
                      <input type="hidden" name="estado" value="en_revision" />
                      <Button type="submit" size="sm" variant="outline">En revisión</Button>
                    </form>
                    <form action={marcarDenuncia} className="flex gap-2">
                      <input type="hidden" name="id" value={d.id} />
                      <input type="hidden" name="estado" value="resuelta" />
                      <input name="resolucion" placeholder="Resolución" className="h-9 rounded-md border border-input bg-background px-3 text-xs" />
                      <Button type="submit" size="sm">Resuelta</Button>
                    </form>
                    <form action={marcarDenuncia} className="flex gap-2">
                      <input type="hidden" name="id" value={d.id} />
                      <input type="hidden" name="estado" value="descartada" />
                      <Button type="submit" size="sm" variant="outline">Descartar</Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
