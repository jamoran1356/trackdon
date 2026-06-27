'use client';
import { useActionState, useState } from 'react';
import { crearDenuncia, type DenunciaState } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TIPOS = [
  { id: 'contra_centro', label: 'Contra un centro de acopio' },
  { id: 'contra_influencer', label: 'Contra un influencer o fundación' },
  { id: 'contra_responsable', label: 'Contra un responsable o voluntario' },
  { id: 'irregularidad_general', label: 'Irregularidad general' }
];

export function DenunciaForm() {
  const [state, action, pending] = useActionState<DenunciaState, FormData>(crearDenuncia, null);
  const [tipo, setTipo] = useState('irregularidad_general');

  return (
    <form action={action} className="space-y-5">
      <fieldset className="space-y-2">
        <Label>¿De qué se trata?</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {TIPOS.map((t) => (
            <label
              key={t.id}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                tipo === t.id ? 'border-primary bg-primary/5' : 'border-input hover:bg-accent'
              }`}
            >
              <input
                type="radio"
                name="tipo"
                value={t.id}
                checked={tipo === t.id}
                onChange={(e) => setTipo(e.target.value)}
                className="accent-primary"
              />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      {tipo !== 'irregularidad_general' && (
        <div className="space-y-2">
          <Label htmlFor="target_id">ID del receptor (si lo conoces, opcional)</Label>
          <Input id="target_id" name="target_id" placeholder="UUID o slug del centro/influencer" />
          <p className="text-xs text-muted-foreground">
            Si no lo tienes, descríbelo en el siguiente campo.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="descripcion">¿Qué pasó?</Label>
        <textarea
          id="descripcion"
          name="descripcion"
          required
          minLength={20}
          maxLength={4000}
          rows={6}
          placeholder="Describe lo que viste con el mayor detalle posible. Fechas, lugares, personas si las conoces."
          className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="adjuntos">Adjuntos (opcional, máximo 3)</Label>
        <input
          id="adjuntos"
          name="adjuntos"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
        />
        <p className="text-xs text-muted-foreground">
          Fotos o PDFs. Máx 10 MB cada uno. No subas imágenes con rostros de damnificados.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
        <p className="text-sm font-medium">Contacto (opcional)</p>
        <p className="text-xs text-muted-foreground">
          Si dejas datos, un validador puede pedirte más información. Si no, la
          denuncia es completamente anónima.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="reporter_nombre" className="text-xs">Nombre</Label>
            <Input id="reporter_nombre" name="reporter_nombre" placeholder="Tu nombre" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reporter_email" className="text-xs">Correo</Label>
            <Input id="reporter_email" name="reporter_email" type="email" placeholder="tu@correo.com" />
          </div>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Enviando…' : 'Enviar denuncia'}
      </Button>
    </form>
  );
}
