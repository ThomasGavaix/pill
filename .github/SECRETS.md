# GitHub Secrets à configurer

Aller dans **Settings → Secrets and variables → Actions** du repo.

> Vercel et Supabase sont connectés nativement à GitHub.
> Vercel gère ses déploiements tout seul — aucun token Vercel n'est nécessaire ici.

## Supabase (migrations automatiques au merge)
| Secret | Où le trouver |
|--------|--------------|
| `SUPABASE_ACCESS_TOKEN` | supabase.com → Account → Access Tokens |
| `SUPABASE_PROJECT_REF` | Project → Settings → General → Reference ID |

## Variables d'environnement du build
| Secret | Où le trouver |
|--------|--------------|
| `VITE_SUPABASE_URL` | Project → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Project → Settings → API → anon public key |
| `VITE_VAPID_PUBLIC_KEY` | `node scripts/generate-vapid-keys.js` |

> Ces 3 variables sont aussi à ajouter dans **Vercel → Project → Settings → Environment Variables**
> pour que le build Vercel les embarque.
