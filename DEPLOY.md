# Deploy a Vercel

Quick guide to put trackdon online. Tarda ~3 minutos si Supabase ya
está aplicado (que es el caso — ver `supabase/README.md`).

## 1. Importar el repo

1. Entra a [vercel.com](https://vercel.com) → continúa con GitHub.
2. **Add New → Project** → busca `jamoran1356/trackdon` → Import.
3. Framework Preset se autodetecta como **Next.js**. Deja todo por
   defecto (Build command, Output, Root directory).

## 2. Variables de entorno

Antes de hacer **Deploy**, abre **Environment Variables** y agrega
estas tres. Aplican a Production, Preview y Development.

| Nombre | Valor | Sensitive |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://akwubyqwnhxqfhakbhee.supabase.co` | no |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` (key pública del proyecto) | no |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` (key privada) | **sí** — marca como sensitive |

> El proyecto Supabase ya tiene el schema aplicado, RLS activado y las
> vistas públicas listas. La key `sb_publishable_` no expone PII gracias
> a las vistas sanitizadas.

NO necesitas en esta fase: `SUPABASE_PAT`, `SUPABASE_PROJECT_REF`
(son solo para correr `supabase/apply.py` localmente),
`NEXT_PUBLIC_SOLANA_RPC_URL` (fase 2),
`KYC_*` (fase 2).

## 3. Deploy

Click **Deploy**. La primera build tarda 1–2 min.

Cuando termine, Vercel te da una URL `*.vercel.app`. CI/CD queda
automático: cada push a `main` redeploya producción.

## 4. Configurar Supabase con la URL de Vercel

Una vez tengas la URL final:

1. Dashboard Supabase → **Authentication → URL Configuration**.
2. **Site URL**: pega tu URL `*.vercel.app`.
3. **Redirect URLs**: agrega `https://<tu-url>/**`.

Sin esto, los emails de confirmación / reset password apuntarían a
`localhost`.

## 5. Smoke después del deploy

```bash
curl -s https://<tu-url>.vercel.app/api/healthz   # si lo agregamos después
curl -s https://<tu-url>.vercel.app/publico       # 200, panel con stats en cero
curl -s -o /dev/null -w "%{http_code}\n" https://<tu-url>.vercel.app/dashboard
# → debe responder 307 (redirect a /login)
```

## Dominio custom (opcional)

En Vercel → Project → **Settings → Domains** → Add. Vercel emite SSL
automático (Let's Encrypt). Actualiza `Site URL` en Supabase a tu
nuevo dominio.
