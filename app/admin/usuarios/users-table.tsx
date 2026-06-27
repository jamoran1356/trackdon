'use client';

import { useActionState, useState } from 'react';
import { changeUserRole, toggleBan, adminResetPassword, deleteUser } from './actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreVertical, ShieldCheck, Ban, KeyRound, Trash2, X } from 'lucide-react';

type Action = 'rol' | 'ban' | 'unban' | 'reset' | 'delete' | null;

interface User {
  id: string;
  anon_id: string;
  username: string;
  email: string;
  rol: string;
  nombre_real: string | null;
  nombre_mostrado: string | null;
  kyc_verificado_at: string | null;
  banned_at: string | null;
  banned_motivo: string | null;
  creado_at: string;
}

const ROLES = ['donante', 'centro_admin', 'centro_responsable', 'influencer', 'validador', 'super_admin'];

export function UsersTable({ users }: { users: User[] }) {
  return (
    <Card>
      <CardContent className="p-0 divide-y divide-border">
        {users.map((u) => <Row key={u.id} user={u} />)}
      </CardContent>
    </Card>
  );
}

function Row({ user }: { user: User }) {
  const [action, setAction] = useState<Action>(null);
  const banned = !!user.banned_at;

  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {(user.username ?? '?').slice(0, 2).toUpperCase()}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-semibold">@{user.username}</span>
            <Badge variant="outline" className="font-mono text-xs">{user.anon_id}</Badge>
            <Badge variant={user.rol === 'super_admin' ? 'warning' : 'secondary'}>{user.rol}</Badge>
            {user.kyc_verificado_at && <Badge variant="default">KYC</Badge>}
            {banned && <Badge variant="warning">BANEADO</Badge>}
          </div>
          <p className="truncate text-xs text-muted-foreground">{user.email || '(sin email)'}</p>
        </div>
        <div className="relative">
          <Button variant="ghost" size="icon" onClick={() => setAction(action ? null : 'rol')} aria-label="Acciones">
            {action ? <X className="h-4 w-4" /> : <MoreVertical className="h-4 w-4" />}
          </Button>
          {action && !['ban','reset','delete'].includes(action) && (
            <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-md border border-border bg-background shadow-md">
              <button onClick={() => setAction('rol')} className="block w-full px-3 py-2 text-left text-sm hover:bg-accent">
                <ShieldCheck className="mr-2 inline h-3.5 w-3.5" /> Cambiar rol
              </button>
              <button onClick={() => setAction(banned ? 'unban' : 'ban')} className="block w-full px-3 py-2 text-left text-sm hover:bg-accent">
                <Ban className="mr-2 inline h-3.5 w-3.5" /> {banned ? 'Desbanear' : 'Banear'}
              </button>
              <button onClick={() => setAction('reset')} className="block w-full px-3 py-2 text-left text-sm hover:bg-accent">
                <KeyRound className="mr-2 inline h-3.5 w-3.5" /> Resetear password
              </button>
              <button onClick={() => setAction('delete')} className="block w-full border-t border-border px-3 py-2 text-left text-sm text-destructive hover:bg-accent">
                <Trash2 className="mr-2 inline h-3.5 w-3.5" /> Eliminar cuenta
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PII visible solo cuando hay acción abierta */}
      {action && (user.nombre_real || user.banned_motivo) && (
        <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs">
          <p className="font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">PII privada</p>
          {user.nombre_real && <p className="mt-1">Nombre real: <strong>{user.nombre_real}</strong></p>}
          {user.banned_motivo && <p className="mt-1 text-destructive">Motivo ban: {user.banned_motivo}</p>}
        </div>
      )}

      {/* Panel de acción */}
      {action === 'rol' && <RolForm user={user} onClose={() => setAction(null)} />}
      {(action === 'ban' || action === 'unban') && <BanForm user={user} action={action} onClose={() => setAction(null)} />}
      {action === 'reset' && <ResetForm user={user} onClose={() => setAction(null)} />}
      {action === 'delete' && <DeleteForm user={user} onClose={() => setAction(null)} />}
    </div>
  );
}

function RolForm({ user, onClose }: { user: User; onClose: () => void }) {
  const [state, action, busy] = useActionState(changeUserRole, null);
  return (
    <form action={action} className="mt-3 grid gap-2 rounded-md border border-border bg-muted/30 p-3 md:grid-cols-[1fr_auto]">
      <input type="hidden" name="user_id" value={user.id} />
      <select name="rol" defaultValue={user.rol} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>Aplicar</Button>
        <Button type="button" size="sm" variant="outline" onClick={onClose}>Cancelar</Button>
      </div>
      {state?.error && <p className="md:col-span-2 text-xs text-destructive">{state.error}</p>}
      {state?.ok && <p className="md:col-span-2 text-xs text-primary">Rol cambiado.</p>}
    </form>
  );
}

function BanForm({ user, action: act, onClose }: { user: User; action: 'ban' | 'unban'; onClose: () => void }) {
  const [state, formAction, busy] = useActionState(toggleBan, null);
  return (
    <form action={formAction} className="mt-3 space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
      <input type="hidden" name="user_id" value={user.id} />
      <input type="hidden" name="action" value={act} />
      {act === 'ban' && (
        <Input name="motivo" placeholder="Motivo (público en el perfil)" className="text-sm" />
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant={act === 'ban' ? 'destructive' : 'outline'} disabled={busy}>
          {act === 'ban' ? 'Banear cuenta' : 'Desbanear'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onClose}>Cancelar</Button>
      </div>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state?.ok && <p className="text-xs text-primary">Listo.</p>}
    </form>
  );
}

function ResetForm({ user, onClose }: { user: User; onClose: () => void }) {
  const [state, action, busy] = useActionState(adminResetPassword, null);
  return (
    <form action={action} className="mt-3 grid gap-2 rounded-md border border-border bg-muted/30 p-3 md:grid-cols-[1fr_auto]">
      <input type="hidden" name="user_id" value={user.id} />
      <div className="space-y-1">
        <Label htmlFor={`pw-${user.id}`} className="text-xs">Nueva contraseña</Label>
        <Input id={`pw-${user.id}`} name="new_password" type="text" placeholder="≥8 caracteres" minLength={8} required />
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit" size="sm" disabled={busy}>Resetear</Button>
        <Button type="button" size="sm" variant="outline" onClick={onClose}>Cancelar</Button>
      </div>
      {state?.error && <p className="md:col-span-2 text-xs text-destructive">{state.error}</p>}
      {state?.ok && <p className="md:col-span-2 text-xs text-primary">Password actualizada.</p>}
    </form>
  );
}

function DeleteForm({ user, onClose }: { user: User; onClose: () => void }) {
  const [state, action, busy] = useActionState(deleteUser, null);
  const [confirm, setConfirm] = useState('');
  const ready = confirm === user.username;
  return (
    <form action={action} className="mt-3 space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
      <input type="hidden" name="user_id" value={user.id} />
      <p className="text-xs">
        Esto elimina la cuenta de auth y todos los registros con FK cascade.
        Escribe <strong>@{user.username}</strong> para confirmar.
      </p>
      <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={`@${user.username}`} className="text-sm" />
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="destructive" disabled={busy || !ready}>Eliminar cuenta</Button>
        <Button type="button" size="sm" variant="outline" onClick={onClose}>Cancelar</Button>
      </div>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state?.ok && <p className="text-xs text-primary">Cuenta eliminada.</p>}
    </form>
  );
}
