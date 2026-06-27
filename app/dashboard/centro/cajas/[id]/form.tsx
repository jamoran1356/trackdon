'use client';

import { useActionState } from 'react';
import { cambiarEstado, distribuirConReceptor, type CentroCajaState } from '../actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, MapPin, CheckCircle2 } from 'lucide-react';

interface Persona { id: string; nombre: string; cargo: string | null }

const NEXT_LABEL: Record<string, { next: string; label: string; icon: typeof Truck; pideFoto: boolean }> = {
  sellada: { next: 'recibida', label: 'Marcar como recibida', icon: CheckCircle2, pideFoto: true },
  recibida: { next: 'en_camion', label: 'Cargar en camión', icon: Truck, pideFoto: false },
  en_camion: { next: 'en_via', label: 'Despachar — en vía', icon: MapPin, pideFoto: false },
  en_via: { next: 'distribuida', label: 'Marcar distribuida', icon: CheckCircle2, pideFoto: true }
};

export function CentroCajaForm({ cajaId, estado, receptor, personal }: {
  cajaId: string; estado: string; receptor: string | null; personal: Persona[];
}) {
  const [chgState, chgAction, chgBusy] = useActionState<CentroCajaState, FormData>(cambiarEstado, null);
  const [distState, distAction, distBusy] = useActionState<CentroCajaState, FormData>(distribuirConReceptor, null);

  const transition = NEXT_LABEL[estado];

  if (estado === 'distribuida') {
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-base font-semibold">Caja distribuida</h2>
          {receptor && <p className="mt-2 text-sm">Receptor final: <strong>{receptor}</strong></p>}
        </CardContent>
      </Card>
    );
  }

  if (!transition) {
    return (
      <Card><CardContent className="p-6 text-sm text-muted-foreground">
        Estado actual no soporta más transiciones.
      </CardContent></Card>
    );
  }

  // Caso en_via → distribuida (pide receptor + foto + personal)
  if (estado === 'en_via') {
    const Icon = transition.icon;
    return (
      <Card className="border-primary/40">
        <CardContent className="p-6">
          <h2 className="mb-1 text-base font-semibold">Distribuir</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Subí una foto del acuso de entrega y elegí quién firma. Receptor final queda en el registro público.
          </p>
          <form action={distAction} className="space-y-3" encType="multipart/form-data">
            <input type="hidden" name="caja_id" value={cajaId} />
            <div className="space-y-2">
              <Label htmlFor="receptor_descripcion">Receptor final</Label>
              <Input id="receptor_descripcion" name="receptor_descripcion" required
                placeholder="Familia García, Caracas · 5 personas (2 adultos, 3 niños)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personal_id">Firma del personal</Label>
              <select id="personal_id" name="personal_id" defaultValue=""
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="">— Opcional —</option>
                {personal.map((p) => <option key={p.id} value={p.id}>{p.nombre}{p.cargo ? ` · ${p.cargo}` : ''}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="foto">Foto del acuso (jpg/png, máx 10 MB)</Label>
              <Input id="foto" name="foto" type="file" accept="image/jpeg,image/png,image/webp" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notas">Notas (opcional)</Label>
              <Input id="notas" name="notas" placeholder="Detalle del acto de entrega" />
            </div>
            <Button type="submit" disabled={distBusy}>
              <Icon className="h-4 w-4" /> {distBusy ? 'Registrando…' : transition.label}
            </Button>
            {distState?.error && <p className="text-sm text-destructive">{distState.error}</p>}
            {distState?.ok && <p className="text-sm text-primary">Caja distribuida.</p>}
          </form>
        </CardContent>
      </Card>
    );
  }

  // Cualquier otra transición. Si pideFoto (sellada→recibida) pedimos foto+personal también
  const Icon = transition.icon;
  const pideAcuso = transition.pideFoto;
  return (
    <Card className="border-primary/40">
      <CardContent className="p-6">
        <h2 className="mb-4 text-base font-semibold">{pideAcuso ? 'Acuso de recibo' : 'Cambiar estado'}</h2>
        <form action={chgAction} className="space-y-3" encType="multipart/form-data">
          <input type="hidden" name="caja_id" value={cajaId} />
          <input type="hidden" name="estado_nuevo" value={transition.next} />
          {pideAcuso && (
            <>
              <div className="space-y-2">
                <Label htmlFor="personal_id">Firma del personal</Label>
                <select id="personal_id" name="personal_id" defaultValue=""
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">— Opcional —</option>
                  {personal.map((p) => <option key={p.id} value={p.id}>{p.nombre}{p.cargo ? ` · ${p.cargo}` : ''}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="foto">Foto del acuso (jpg/png, máx 10 MB)</Label>
                <Input id="foto" name="foto" type="file" accept="image/jpeg,image/png,image/webp" />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="nota">Nota (opcional)</Label>
            <Input id="nota" name="nota" placeholder="Detalle del cambio" />
          </div>
          <Button type="submit" disabled={chgBusy}>
            <Icon className="h-4 w-4" /> {chgBusy ? 'Cambiando…' : transition.label}
          </Button>
          {chgState?.error && <p className="text-sm text-destructive">{chgState.error}</p>}
          {chgState?.ok && <p className="text-sm text-primary">Estado actualizado.</p>}
        </form>
      </CardContent>
    </Card>
  );
}
