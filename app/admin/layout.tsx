import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { AdminSidebar } from '@/components/site/admin-sidebar';
import { MobileShell } from '@/components/site/mobile-shell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.rol !== 'super_admin') redirect('/dashboard');

  return (
    <MobileShell sidebar={<AdminSidebar />} brandLabel="trackdon · admin">{children}</MobileShell>
  );
}
