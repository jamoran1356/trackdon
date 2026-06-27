import Link from 'next/link';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowRight, AlertTriangle } from 'lucide-react';

export const metadata = { title: 'Invitación a trackdon' };
export const dynamic = 'force-dynamic';

export default async function InvitarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createSupabaseAdmin();

  const { data: inv } = await admin
    .from('invitaciones')
    .select('id, email, evento_id, mensaje, estado, creado_at, expires_at, invitado_por_auth_id')
    .eq('token', token)
    .maybeSingle();

  if (!inv) {
    return (
      <>
        <SiteHeader />
        <main className="container max-w-xl py-14">
          <Card><CardContent className="p-8 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
            <h1 className="mt-3 text-2xl font-bold">Invitación no encontrada</h1>
            <p className="mt-2 text-sm text-muted-foreground">El link puede haber expirado o ser inválido.</p>
          </CardContent></Card>
        </main>
        <SiteFooter />
      </>
    );
  }

  const expirada = new Date(inv.expires_at) < new Date();
  const consumida = inv.estado !== 'pendiente';

  // Datos contextuales: quién invitó y a qué evento
  let inviterUsername = 'alguien';
  if (inv.invitado_por_auth_id) {
    const { data: p } = await admin.from('perfiles').select('username').eq('id', inv.invitado_por_auth_id).maybeSingle();
    inviterUsername = p?.username ?? inviterUsername;
  }
  let eventoNombre: string | undefined;
  if (inv.evento_id) {
    const { data: e } = await admin.from('eventos').select('nombre').eq('id', inv.evento_id).maybeSingle();
    eventoNombre = e?.nombre ?? undefined;
  }

  const user = await getSessionUser();
  const sameEmail = user?.email?.toLowerCase() === inv.email.toLowerCase();

  // Marcar como aceptada si está logueado con el email correcto y todavía pendiente
  if (user && sameEmail && !consumida && !expirada) {
    await admin.from('invitaciones').update({
      estado: 'aceptada',
      aceptada_at: new Date().toISOString(),
      aceptada_por_auth_id: user.id
    }).eq('id', inv.id);
  }

  return (
    <>
      <SiteHeader />
      <main className="container max-w-xl py-14">
        <Card>
          <CardContent className="p-8">
            <Badge variant="outline">Invitación</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
              <span className="font-mono">@{inviterUsername}</span> te invita a trackdon
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Email: <strong>{inv.email}</strong>
              {eventoNombre && <> · Evento: <strong>{eventoNombre}</strong></>}
            </p>

            {inv.mensaje && (
              <div className="mt-4 rounded-md border-l-2 border-primary/60 bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Mensaje</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{inv.mensaje}</p>
              </div>
            )}

            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>trackdon</strong> es el libro público de donaciones humanitarias.
                No custodia fondos. Los donantes registran a quién entregaron;
                vos registrás cómo se usó.
              </p>
            </div>

            {expirada && (
              <div className="mt-6 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2">
                <Clock className="h-4 w-4" /> Esta invitación expiró el {new Date(inv.expires_at).toLocaleDateString()}.
              </div>
            )}

            {consumida && !expirada && (
              <div className="mt-6 rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
                Esta invitación ya fue aceptada.
              </div>
            )}

            {!expirada && !consumida && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {user && sameEmail ? (
                  <Button asChild className="flex-1">
                    <Link href={`/registro-centro?evento_id=${inv.evento_id ?? ''}`}>
                      Registrar mi organización <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : user && !sameEmail ? (
                  <div className="flex-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
                    Estás logueado como <strong>{user.email}</strong>, pero esta invitación es para <strong>{inv.email}</strong>.
                    Cerrá sesión y registrate con el email correcto.
                  </div>
                ) : (
                  <Button asChild className="flex-1">
                    <Link href={`/registro?invite_token=${token}`}>
                      Crear mi cuenta <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          ¿Por qué llegaste acá? <span className="font-mono">@{inviterUsername}</span> te donó y necesita
          que rindas en qué se invirtió, para cerrar el rastro público.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
