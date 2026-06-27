import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { signOut } from '@/app/(auth)/actions';
import { Calendar, Mail, Shield, LayoutDashboard, LogOut } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.rol !== 'super_admin') redirect('/dashboard');

  const navItems = [
    { href: '/admin', label: 'Inicio', icon: LayoutDashboard },
    { href: '/admin/eventos', label: 'Eventos', icon: Calendar },
    { href: '/admin/smtp', label: 'SMTP', icon: Mail }
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-muted/30 lg:flex-row">
      <aside className="lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:border-r lg:border-border/60 lg:bg-background">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 lg:flex-col lg:items-start lg:gap-3 lg:border-b-0 lg:px-5 lg:py-6">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground text-sm">td</span>
            <span className="text-base">trackdon</span>
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
            <Shield className="h-3 w-3" /> Admin
          </span>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 py-2 lg:flex-col lg:gap-0.5 lg:px-3 lg:py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block lg:absolute lg:bottom-0 lg:w-64 lg:border-t lg:border-border/60 lg:bg-background">
          <div className="px-4 py-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">{user.nombre ?? 'super admin'}</p>
            <p className="truncate">super_admin</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 border-t border-border/60 px-4 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </form>
          <Link
            href="/"
            className="block border-t border-border/60 px-4 py-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            ← Volver al sitio público
          </Link>
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 lg:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}
