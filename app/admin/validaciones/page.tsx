import Link from 'next/link';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';

export const metadata = { title: 'Validaciones — admin' };
export const dynamic = 'force-dynamic';

export default async function AdminValidacionesPage() {
  const admin = createSupabaseAdmin();
  const [{ count: infsPend }, { count: rendsPend }, { count: denunciasPend }] = await Promise.all([
    admin.from('influencers').select('id', { count: 'exact', head: true }).is('verificado_at', null).is('rechazado_at', null),
    admin.from('rendiciones').select('id', { count: 'exact', head: true }).is('verificado_at', null).is('rechazado_at', null),
    admin.from('denuncias').select('id', { count: 'exact', head: true }).eq('estado', 'abierta')
  ]);

  const queues = [
    { label: 'Influencers pendientes de verificar', count: infsPend ?? 0, href: '/dashboard/validador' },
    { label: 'Rendiciones pendientes', count: rendsPend ?? 0, href: '/dashboard/validador' },
    { label: 'Denuncias abiertas', count: denunciasPend ?? 0, href: '/admin/denuncias' }
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Validaciones</h1>
        <p className="text-sm text-muted-foreground">Cola de revisión.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {queues.map((q) => (
          <Link key={q.label} href={q.href}>
            <Card className="transition-colors hover:bg-accent">
              <CardContent className="p-5">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{q.label}</p>
                <p className="mt-1 text-3xl font-bold">{q.count}</p>
                {q.count > 0 && <Badge variant="default" className="mt-2">Atención</Badge>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
