import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { signOut } from '@/app/(auth)/actions';
import {
  LayoutDashboard, Calendar, Warehouse, Megaphone, ShieldCheck,
  AlertTriangle, Users, ScrollText, Mail, Palette, FileText,
  LogOut, Shield, ExternalLink
} from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.rol !== 'super_admin') redirect('/dashboard');

  const sections: { title?: string; items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] }[] = [
    {
      items: [
        { href: '/admin', label: 'Inicio', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Operación',
      items: [
        { href: '/admin/eventos', label: 'Eventos', icon: Calendar },
        { href: '/admin/centros', label: 'Centros de acopio', icon: Warehouse },
        { href: '/admin/influencers', label: 'Influencers', icon: Megaphone },
        { href: '/admin/validaciones', label: 'Validaciones', icon: ShieldCheck },
        { href: '/admin/denuncias', label: 'Denuncias', icon: AlertTriangle }
      ]
    },
    {
      title: 'Sistema',
      items: [
        { href: '/admin/usuarios', label: 'Usuarios y roles', icon: Users },
        { href: '/admin/auditoria', label: 'Auditoría / log', icon: ScrollText }
      ]
    },
    {
      title: 'Configuración',
      items: [
        { href: '/admin/smtp', label: 'SMTP', icon: Mail },
        { href: '/admin/branding', label: 'Branding', icon: Palette },
        { href: '/admin/legales', label: 'Legales', icon: FileText }
      ]
    }
  ];

  return (
    <div className="flex min-h-dvh bg-muted/30">
      <aside className="sticky top-0 h-dvh w-64 shrink-0 border-r border-border/60 bg-background flex-col hidden md:flex">
        <div className="border-b border-border/60 px-5 py-4">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground text-sm">td</span>
            <span className="text-base">trackdon</span>
          </Link>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
            <Shield className="h-3 w-3" /> Admin
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {sections.map((sec, i) => (
            <div key={i}>
              {sec.title && <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{sec.title}</p>}
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border/60 bg-background">
          <div className="px-4 py-3 text-xs">
            <p className="font-medium text-foreground">{user.nombre ?? 'super admin'}</p>
            <p className="truncate text-muted-foreground">{user.email}</p>
          </div>
          <Link
            href="/admin/cuenta"
            className="block border-t border-border/60 px-4 py-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Mi cuenta
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
            Ver sitio público
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <LogOut className="h-3 w-3" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 md:px-8 md:py-10 min-w-0">
        {children}
      </main>
    </div>
  );
}
