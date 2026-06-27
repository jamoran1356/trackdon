import { Card, CardContent } from '@/components/ui/card';

export const metadata = { title: 'Branding — admin' };

export default function AdminBrandingPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Branding</h1>
        <p className="text-sm text-muted-foreground">Logo, colores y nombre público del sitio.</p>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Configuración de branding — próximamente.
        </CardContent>
      </Card>
    </>
  );
}
