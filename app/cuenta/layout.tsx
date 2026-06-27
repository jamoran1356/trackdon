import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { UserSidebar } from '@/components/site/user-sidebar';

export default async function CuentaLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return (
    <div className="flex min-h-dvh bg-muted/30">
      <UserSidebar />
      <main className="flex-1 px-4 py-6 md:px-8 md:py-10 min-w-0">
        {children}
      </main>
    </div>
  );
}
