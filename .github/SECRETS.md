# GitHub Secrets à configurer

**Settings → Secrets and variables → Actions** du repo GitHub.

## Supabase (migrations au merge)
| Secret | Où le trouver |
|--------|--------------|
| `SUPABASE_ACCESS_TOKEN` | supabase.com → Account → Access Tokens |
| `SUPABASE_PROJECT_ID` | Project → Settings → General → Reference ID |

## Build (CI + Vercel)
| Secret | Où le trouver |
|--------|--------------|
| `VITE_SUPABASE_URL` | Project → Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Project → Settings → API → Publishable key |
| `VITE_VAPID_PUBLIC_KEY` | `node scripts/generate-vapid-keys.js` |

> Les 3 variables `VITE_*` sont aussi à ajouter dans
> **Vercel → Project → Settings → Environment Variables**.
