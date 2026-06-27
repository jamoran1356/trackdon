import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSessionUser } from '@/lib/auth';
import { NuevaRendicionForm } from './form';

export const metadata = { title: 'Nueva rendición' };

export default async function NuevaRendicionPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?return_to=/dashboard/influencer/rendiciones/nueva');

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Nueva rendición</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sube el comprobante del gasto. Un validador la revisa antes de que cuente como entregado.
      </p>
      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle>Detalles del gasto</CardTitle>
          <CardDescription>El comprobante es privado, solo lo ven validadores.</CardDescription>
        </CardHeader>
        <CardContent>
          <NuevaRendicionForm />
        </CardContent>
      </Card>
    </>
  );
}
