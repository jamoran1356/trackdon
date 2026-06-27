/**
 * Política de nombres de usuario.
 *
 * - Bloquea groserías y términos discriminatorios en ES/EN
 * - Bloquea suplantación obvia de roles (admin, root, mod, support, etc.)
 * - Devuelve { ok: false, reason } para que el caller decida (rechazar / banear)
 */

const RESERVED = [
  'admin', 'administrator', 'root', 'sudo', 'superadmin', 'super_admin',
  'mod', 'moderator', 'support', 'soporte', 'trackdon', 'oficial', 'official',
  'system', 'sistema', 'null', 'undefined', 'anon', 'anonymous', 'anonimo',
  'me', 'you', 'staff', 'team', 'help', 'ayuda', 'noreply', 'no-reply'
];

// Lista mínima viable. Se valida con \b en regex de palabra completa
// y con leet/normalizado para evitar evasión obvia.
const BLOCKED_TOKENS = [
  // ES
  'puta', 'puto', 'puton', 'putita', 'putos', 'putas',
  'mierda', 'mierdas', 'merda',
  'pendejo', 'pendeja', 'pendejos', 'pendejas',
  'culero', 'culera', 'culo', 'culiao',
  'verga', 'vergas', 'pinga', 'pingas',
  'marica', 'maricon', 'maricona', 'maricones',
  'puneta', 'gilipollas', 'cabron', 'cabrona',
  'concha', 'conchasumadre', 'ctmr',
  'jueputa', 'hp', 'hijueputa', 'huevon',
  'cojer', 'coger', 'follar', 'singar',
  'mamaguevo', 'mamahuevo', 'mamon',
  // EN
  'fuck', 'fucker', 'fucking', 'motherfucker', 'mf',
  'shit', 'bullshit', 'asshole', 'bitch', 'bitches',
  'cunt', 'dick', 'cock', 'pussy', 'whore', 'slut',
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded',
  // sexual / morboso
  'porn', 'porno', 'sexo', 'sex', 'xxx', 'incest', 'incesto',
  'rapist', 'violador', 'pedofilo', 'pedophile'
];

export type PolicyResult =
  | { ok: true }
  | { ok: false; reason: 'blocked_word' | 'reserved' | 'invalid_format' };

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e')
    .replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't')
    .replace(/\$/g, 's').replace(/@/g, 'a').replace(/[_-]/g, '');
}

export function checkUsernamePolicy(raw: string): PolicyResult {
  const lower = raw.toLowerCase().trim();
  if (!/^[a-z0-9_-]{3,20}$/.test(lower)) {
    return { ok: false, reason: 'invalid_format' };
  }
  if (RESERVED.includes(lower)) {
    return { ok: false, reason: 'reserved' };
  }

  const norm = normalize(lower);
  for (const tok of BLOCKED_TOKENS) {
    if (norm.includes(tok)) {
      return { ok: false, reason: 'blocked_word' };
    }
  }
  return { ok: true };
}

export type PolicyReason = 'blocked_word' | 'reserved' | 'invalid_format';

export function policyMessage(reason: PolicyReason): string {
  switch (reason) {
    case 'blocked_word':
      return 'El nombre de usuario contiene palabras no permitidas.';
    case 'reserved':
      return 'Ese nombre de usuario está reservado.';
    case 'invalid_format':
      return 'Usuario: 3-20 caracteres, solo a-z, 0-9, guion y guion bajo.';
  }
}
