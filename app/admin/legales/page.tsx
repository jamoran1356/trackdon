import { Card, CardContent } from '@/components/ui/card';

export const metadata = { title: 'Legales — admin' };

export default function AdminLegalesPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Legales</h1>
        <p className="text-sm text-muted-foreground">Términos y condiciones, política de privacidad.</p>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Editor de textos legales — próximamente.
        </CardContent>
      </Card>
    </>
  );
}
