import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';

export const metadata = { title: 'Dashboard' };

export default async function DashboardDispatcher() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  switch (user.rol) {
    case 'centro_admin':
    case 'centro_responsable':
      redirect('/dashboard/centro');
    case 'influencer':
      redirect('/dashboard/influencer');
    case 'validador':
    case 'super_admin':
      // For now, validators land on the public board until their UI exists.
      redirect('/publico');
    case 'donante':
    default:
      redirect('/donar');
  }
}
