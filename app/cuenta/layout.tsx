import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { UserSidebar } from '@/components/site/user-sidebar';
import { MobileShell } from '@/components/site/mobile-shell';

export default async function CuentaLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return (
    <MobileShell sidebar={<UserSidebar />}>{children}</MobileShell>
  );
}
