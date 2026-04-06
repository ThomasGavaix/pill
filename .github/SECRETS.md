# GitHub Secrets à configurer

Aller dans **Settings → Secrets and variables → Actions** du repo et ajouter :

## Supabase
| Secret | Où le trouver |
|--------|--------------|
| `SUPABASE_ACCESS_TOKEN` | supabase.com → Account → Access Tokens |
| `SUPABASE_PROJECT_REF` | supabase.com → Project → Settings → General → Reference ID |
| `VITE_SUPABASE_URL` | supabase.com → Project → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | supabase.com → Project → Settings → API → anon key |

## Vercel
| Secret | Où le trouver |
|--------|--------------|
| `VERCEL_TOKEN` | vercel.com → Account → Settings → Tokens |
| `VERCEL_ORG_ID` | `vercel env pull` ou `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` → `projectId` |

## Push notifications (VAPID)
| Secret | Comment |
|--------|---------|
| `VITE_VAPID_PUBLIC_KEY` | `node scripts/generate-vapid-keys.js` |

## Setup Vercel en 2 minutes
```bash
npm i -g vercel
vercel login
vercel link   # dans le dossier du projet
cat .vercel/project.json  # copier orgId et projectId
```
