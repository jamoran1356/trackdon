'use client';

import { useActionState, useState } from 'react';
import { changeUserRole, toggleBan, adminResetPassword } from './actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Ban, KeyRound, ShieldCheck } from 'lucide-react';

interface User {
  id: string;
  anon_id: string;
  username: string;
  nombre_real: string | null;
  kyc_verificado_at: string | null;
  email: string;
  rol: string;
  nombre_mostrado: string | null;
  banned_at: string | null;
  banned_motivo: string | null;
  creado_at: string;
}

const ROLES = ['donante', 'centro_admin', 'centro_responsable', 'influencer', 'validador', 'super_admin'];

export function UserRow({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [roleState, roleAction, roleBusy] = useActionState(changeUserRole, null);
  const [banState, banAction, banBusy] = useActionState(toggleBan, null);
  const [pwState, pwAction, pwBusy] = useActionState(adminResetPassword, null);

  const banned = !!user.banned_at;

  return (
    <Card className={banned ? 'border-destructive/40' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary"
          >
            {(user.nombre_mostrado ?? user.email ?? 'U').slice(0, 2).toUpperCase()}
          </button>
          <div className="min-w-0 flex-1" onClick={() => setOpen(!open)} role="button" tabIndex={0}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">@{user.username}</span>
              <Badge variant="outline" className="font-mono text-xs">{user.anon_id}</Badge>
              <Badge variant={user.rol === 'super_admin' ? 'warning' : 'secondary'}>{user.rol}</Badge>
              {user.kyc_verificado_at && <Badge variant="default">KYC</Badge>}
              {banned && <Badge variant="warning">BANEADO</Badge>}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {user.nombre_real ? <span className="text-foreground">{user.nombre_real}</span> : <span className="italic">sin nombre real</span>}
              {' · '}{user.email || '(sin email)'}
            </p>
            {banned && user.banned_motivo && (
              <p className="mt-1 text-xs text-destructive">Motivo: {user.banned_motivo}</p>
            )}
          </div>
        </div>

        {open && (
          <div className="mt-4 grid gap-4 border-t border-border/60 pt-4 md:grid-cols-3">
            {/* Cambiar rol */}
            <form action={roleAction} className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cambiar rol</label>
              <input type="hidden" name="user_id" value={user.id} />
              <select name="rol" defaultValue={user.rol} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <Button type="submit" size="sm" variant="outline" disabled={roleBusy} className="w-full">
                <ShieldCheck className="h-3 w-3" /> Aplicar
              </Button>
              {roleState?.error && <p className="text-xs text-destructive">{roleState.error}</p>}
              {roleState?.ok && <p className="text-xs text-primary">Rol cambiado.</p>}
            </form>

            {/* Ban / Unban */}
            <form action={banAction} className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {banned ? 'Desbanear' : 'Banear'}
              </label>
              <input type="hidden" name="user_id" value={user.id} />
              <input type="hidden" name="action" value={banned ? 'unban' : 'ban'} />
              {!banned && (
                <Input name="motivo" placeholder="Motivo (opcional)" className="text-sm" />
              )}
              <Button type="submit" size="sm" variant={banned ? 'outline' : 'destructive'} disabled={banBusy} className="w-full">
                <Ban className="h-3 w-3" /> {banned ? 'Desbanear' : 'Banear'}
              </Button>
              {banState?.error && <p className="text-xs text-destructive">{banState.error}</p>}
              {banState?.ok && <p className="text-xs text-primary">Listo.</p>}
            </form>

            {/* Reset password */}
            <form action={pwAction} className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resetear password</label>
              <input type="hidden" name="user_id" value={user.id} />
              <Input name="new_password" type="text" placeholder="Nueva password ≥8" minLength={8} className="text-sm" />
              <Button type="submit" size="sm" variant="outline" disabled={pwBusy} className="w-full">
                <KeyRound className="h-3 w-3" /> Resetear
              </Button>
              {pwState?.error && <p className="text-xs text-destructive">{pwState.error}</p>}
              {pwState?.ok && <p className="text-xs text-primary">Password actualizada.</p>}
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
