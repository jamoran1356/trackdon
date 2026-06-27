import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EventoForm } from './form';

export const metadata = { title: 'Nuevo evento' };

export default function NuevoEventoPage() {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Nuevo evento</CardTitle>
        <CardDescription>
          Una emergencia o crisis a la que se asociarán centros, influencers,
          donaciones y damnificados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EventoForm />
      </CardContent>
    </Card>
  );
}
