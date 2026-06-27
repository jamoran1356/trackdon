import Link from 'next/link';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Mail, Users, AlertTriangle } from 'lucide-react';

export const metadata = { title: 'Admin — trackdon' };
export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const admin = createSupabaseAdmin();
  const [eventos, perfiles, denuncias, smtp] = await Promise.all([
    admin.from('eventos').select('id', { count: 'exact', head: true }),
    admin.from('perfiles').select('id', { count: 'exact', head: true }),
    admin.from('denuncias').select('id', { count: 'exact', head: true }),
    admin.from('smtp_config').select('enabled').eq('id', 1).maybeSingle()
  ]);

  const tiles = [
    { label: 'Eventos', value: eventos.count ?? 0, href: '/admin/eventos', icon: Calendar },
    { label: 'Usuarios', value: perfiles.count ?? 0, href: '#', icon: Users },
    { label: 'Denuncias', value: denuncias.count ?? 0, href: '#', icon: AlertTriangle },
    {
      label: 'SMTP',
      value: smtp.data?.enabled ? 'Activo' : 'Inactivo',
      href: '/admin/smtp',
      icon: Mail
    }
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Panel admin</h1>
        <p className="text-sm text-muted-foreground">Gestión del sistema, eventos y configuración.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.label} href={t.href}>
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex items-start gap-3 p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.label}</p>
                    <p className="mt-1 text-2xl font-bold">{t.value}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
