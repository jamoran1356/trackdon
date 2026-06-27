import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { signOut } from '@/app/(auth)/actions';
import { LogOut, LayoutDashboard, Shield } from 'lucide-react';

export async function UserMenu() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Iniciar sesión</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/registro">Crear cuenta</Link>
        </Button>
      </div>
    );
  }

  // Destino del panel según rol
  const dashboardHref = user.rol === 'super_admin'
    ? '/admin'
    : user.rol === 'centro_admin' || user.rol === 'centro_responsable'
      ? '/dashboard/centro'
      : user.rol === 'influencer'
        ? '/dashboard/influencer'
        : user.rol === 'validador'
          ? '/dashboard/validador'
          : '/dashboard';

  const panelLabel = user.rol === 'super_admin' ? 'Admin' : 'Mi panel';
  const PanelIcon = user.rol === 'super_admin' ? Shield : LayoutDashboard;

  return (
    <div className="flex items-center gap-2">
      <Button asChild size="sm" variant="default">
        <Link href={dashboardHref}>
          <PanelIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{panelLabel}</span>
        </Link>
      </Button>
      <span className="hidden md:inline font-mono text-xs text-muted-foreground">@{user.username}</span>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="icon" aria-label="Cerrar sesión">
          <LogOut className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
