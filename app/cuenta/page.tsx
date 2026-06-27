import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { CuentaForms } from './forms';

export const metadata = { title: 'Mi cuenta — trackdon' };
export const dynamic = 'force-dynamic';

export default async function CuentaPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Mi cuenta</h1>
        <p className="text-sm text-muted-foreground">{user.email} · {user.rol}</p>
      </div>
      <CuentaForms email={user.email ?? ''} nombre={user.nombre ?? ''} />
    </>
  );
}
