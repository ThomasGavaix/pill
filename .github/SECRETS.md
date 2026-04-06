# GitHub Secrets à configurer

Aller dans **Settings → Secrets and variables → Actions** du repo.

> Vercel et Supabase Branching sont connectés nativement à GitHub.
> GitHub Actions ne fait que vérifier que le build compile.

## Variables d'environnement du build CI
| Secret | Où le trouver |
|--------|--------------|
| `VITE_SUPABASE_URL` | Supabase → Project → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project → Settings → API → anon public key |
| `VITE_VAPID_PUBLIC_KEY` | `node scripts/generate-vapid-keys.js` |

> Ces 3 variables sont aussi à ajouter dans **Vercel → Project → Settings → Environment Variables**.

---

## Si tu n'as pas Supabase Branching (plan Free)

Ajouter également ces 2 secrets et réactiver le job `supabase-migrate` :

| Secret | Où le trouver |
|--------|--------------|
| `SUPABASE_ACCESS_TOKEN` | supabase.com → Account → Access Tokens |
| `SUPABASE_PROJECT_REF` | Project → Settings → General → Reference ID |
