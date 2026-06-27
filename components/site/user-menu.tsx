import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { signOut } from '@/app/(auth)/actions';
import { LogOut, User } from 'lucide-react';

const rolLabel: Record<string, string> = {
  donante: 'Donante',
  centro_admin: 'Centro · admin',
  centro_responsable: 'Centro · responsable',
  influencer: 'Influencer',
  validador: 'Validador',
  super_admin: 'Super admin'
};

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
  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-1.5">
        <User className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="leading-tight">
          <p className="text-xs font-medium">{user.nombre ?? user.email}</p>
          <p className="text-[10px] text-muted-foreground">{rolLabel[user.rol] ?? user.rol}</p>
        </div>
      </div>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="icon" aria-label="Cerrar sesión">
          <LogOut className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
