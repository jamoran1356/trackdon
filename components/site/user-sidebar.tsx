import Link from 'next/link';
import { signOut } from '@/app/(auth)/actions';
import { getSessionUser } from '@/lib/auth';
import {
  LayoutDashboard, UserCircle, PackageOpen, Megaphone, Warehouse, ShieldCheck,
  ExternalLink, LogOut, Shield
} from 'lucide-react';

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

export async function UserSidebar() {
  const user = await getSessionUser();
  if (!user) return null;

  const sections: { title?: string; items: NavItem[] }[] = [
    {
      items: [
        { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
        { href: '/cuenta', label: 'Mi cuenta', icon: UserCircle }
      ]
    }
  ];

  const operaItems: NavItem[] = [];
  if (user.rol === 'donante') {
    operaItems.push({ href: '/donar', label: 'Registrar entrega', icon: PackageOpen });
  }
  if (user.rol === 'influencer') {
    operaItems.push({ href: '/dashboard/influencer', label: 'Mi panel', icon: Megaphone });
  }
  if (user.rol === 'centro_admin' || user.rol === 'centro_responsable') {
    operaItems.push({ href: '/dashboard/centro', label: 'Mi centro', icon: Warehouse });
  }
  if (user.rol === 'validador') {
    operaItems.push({ href: '/dashboard/validador', label: 'Cola de validación', icon: ShieldCheck });
  }
  if (operaItems.length > 0) {
    sections.push({ title: 'Operación', items: operaItems });
  }

  if (user.rol === 'super_admin') {
    sections.push({
      title: 'Admin',
      items: [{ href: '/admin', label: 'Panel admin', icon: Shield }]
    });
  }

  return (
    <aside className="sticky top-0 h-dvh w-64 shrink-0 border-r border-border/60 bg-background flex-col hidden md:flex">
      <div className="border-b border-border/60 px-5 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground text-sm">td</span>
          <span className="text-base">trackdon</span>
        </Link>
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
          <p className="font-medium text-foreground">{user.nombre ?? 'usuario'}</p>
          <p className="truncate text-muted-foreground">{user.email}</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3" />
          Sitio público
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
  );
}
