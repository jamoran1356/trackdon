import { getSessionUser } from '@/lib/auth';
import { CuentaForms } from '@/app/cuenta/forms';

export const metadata = { title: 'Mi cuenta — admin' };
export const dynamic = 'force-dynamic';

export default async function AdminCuentaPage() {
  const user = await getSessionUser();
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Mi cuenta</h1>
        <p className="text-sm text-muted-foreground">{user?.email} · {user?.rol}</p>
      </div>
      <CuentaForms
        email={user?.email ?? ''}
        username={user?.username ?? ''}
        nombreReal={user?.nombreReal ?? ''}
        kycVerifiedAt={user?.kycVerifiedAt ?? null}
      />
    </>
  );
}
