import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Badge } from '@/components/ui/badge';
import { getSessionUser } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.rol !== 'super_admin') redirect('/dashboard');

  return (
    <>
      <SiteHeader />
      <main className="container py-6 md:py-10">
        <div className="mb-6 flex items-center gap-3">
          <Badge variant="default">Admin</Badge>
          <nav className="flex gap-3 text-sm text-muted-foreground">
            <Link href="/admin/eventos" className="hover:text-foreground">Eventos</Link>
          </nav>
        </div>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
