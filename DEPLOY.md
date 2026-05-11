# Deploy Runbook — themotionagency.net

Production stack: **Hetzner Cloud (CPX 32, Nuremberg) + Coolify v4 + Next.js 16 standalone Docker + Traefik + Let's Encrypt + Resend**.

The site lives at <https://themotionagency.net> (DNS `A` record → `178.104.239.192`).

## TL;DR for "I just want to deploy"

```bash
git push deploy main          # triggers GitHub Actions → Coolify deploy
# (optional — keep org repo in sync)
git push origin main
```

That's it. The GitHub Actions workflow at `.github/workflows/deploy.yml` runs on push to `main`, calls Coolify's deploy API, and polls until the app is healthy.

## Repos and remotes

| Remote   | URL                                                       | Visibility | Purpose                                      |
|----------|-----------------------------------------------------------|------------|----------------------------------------------|
| `origin` | https://github.com/themotionagency/tma-website.git        | Private    | Canonical org repo                           |
| `deploy` | https://github.com/primovera12/the-motion-agency-web.git  | Public     | Coolify pulls from here (no SSH key needed). The deploy workflow lives here. |

`git push deploy main` is what fires the deploy. `git push origin main` is just to keep the org repo in lockstep — push both to keep them aligned.

## What's in the repo

```
.
├── tma-web/                   # Next.js 16 production app (Coolify build root)
├── tma-website/               # Original hand-built design (kept for reference; not deployed)
├── .github/workflows/deploy.yml
└── DEPLOY.md                  # this file
```

Coolify is configured with **Base directory = `/tma-web`**, so it builds the Next.js app and ignores `tma-website/`.

## Server access

```bash
ssh -i ~/.ssh/tma_deploy root@178.104.239.192
```

Coolify dashboard: <http://178.104.239.192:8000>
- email: `rabih@chipatech.com`
- password: kept in your local credentials store (`~/.claude/projects/.../memory/credentials.md`), never in this repo.

## Environment variables (set in Coolify, not the repo)

| Key                       | Value                                       |
|---------------------------|---------------------------------------------|
| `RESEND_API_KEY`          | `re_***` (rotate at <https://resend.com/api-keys>) |
| `CONTACT_TO`              | `info@themotionagency.net`                  |
| `NEXT_TELEMETRY_DISABLED` | `1`                                         |
| `NODE_ENV`                | `production`                                |
| `RESEND_FROM` *(optional)*| `The Motion Agency <noreply@themotionagency.net>` — set this only after you've verified `themotionagency.net` in the Resend dashboard. Until then, leave unset and emails send from `onboarding@resend.dev` (still delivered to `info@themotionagency.net`). |

To change them: Coolify dashboard → tma-web → Environment Variables → save → redeploy.
Or via API:
```bash
curl -X POST \
  -H "Authorization: Bearer $COOLIFY_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key":"FOO","value":"bar","is_preview":false,"is_literal":true,"is_multiline":false}' \
  http://178.104.239.192:8000/api/v1/applications/jz8t7nrywnv2jh54l0gfqzzx/envs
```

## GitHub Actions secrets

Set on `primovera12/the-motion-agency-web`:

| Secret               | Value                                              |
|----------------------|----------------------------------------------------|
| `COOLIFY_BASE_URL`   | `http://178.104.239.192:8000`                      |
| `COOLIFY_API_TOKEN`  | `2|...` (full token in your local credentials store) |
| `COOLIFY_APP_UUID`   | `jz8t7nrywnv2jh54l0gfqzzx`                          |

To rotate: regenerate the Coolify token in the dashboard → Settings → API tokens, then `gh secret set COOLIFY_API_TOKEN --repo primovera12/the-motion-agency-web < newtoken.txt`.

## Manual deploy commands

```bash
# Trigger deploy via Coolify API
curl -H "Authorization: Bearer $COOLIFY_API_TOKEN" \
  "http://178.104.239.192:8000/api/v1/deploy?uuid=jz8t7nrywnv2jh54l0gfqzzx&force=true"

# Watch logs
ssh -i ~/.ssh/tma_deploy root@178.104.239.192 'docker logs -f $(docker ps --format "{{.Names}}" | grep tma-web | head -1)'

# Manual GitHub Actions run (no commit needed)
gh workflow run deploy.yml --repo primovera12/the-motion-agency-web
```

## Roll back

```bash
# 1. Find the previous good commit
git log --oneline -10
# 2. Reset main to it
git reset --hard <sha>
git push deploy main --force-with-lease
git push origin main --force-with-lease
# 3. The push triggers a redeploy of the older code
```

Or via the Coolify UI: tma-web → Deployments → click an older successful deployment → "Redeploy".

## DNS

The user controls DNS. Required records:

| Type | Name | Value             | TTL   |
|------|------|-------------------|-------|
| A    | @    | `178.104.239.192` | 3600  |
| A    | www  | `178.104.239.192` | 3600  |

Coolify provisions Let's Encrypt automatically once the records propagate (usually <60s).

## Resend domain verification (optional but recommended)

Until `themotionagency.net` is verified in Resend, emails are sent from `onboarding@resend.dev` (still delivered to your inbox). To send from `noreply@themotionagency.net` instead:

1. Go to <https://resend.com/domains> → Add Domain → `themotionagency.net`.
2. Add the DNS records Resend gives you (TXT for SPF, TXT for DKIM, TXT for DMARC, optional MX for return path) to your DNS provider.
3. Wait for verification (usually <10 min).
4. In Coolify, add env var `RESEND_FROM=The Motion Agency <noreply@themotionagency.net>` and redeploy.

## Health checks

```bash
# Site loads
curl -I https://themotionagency.net/

# Forms work end-to-end (sends a real email — keep test runs sparse)
curl -X POST -H 'Content-Type: application/json' \
  -d '{"name":"healthcheck","company":"x","email":"info@themotionagency.net","need":"x","message":"ok","_hp":""}' \
  https://themotionagency.net/api/contact

# Container running
ssh -i ~/.ssh/tma_deploy root@178.104.239.192 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep tma'

# Coolify itself
curl http://178.104.239.192:8000/api/health
```

## Future Claude sessions

A future Claude with this repo open should:
1. Read `~/.claude/projects/c--Users-USER-Desktop-websites-1-LIVE-The-motion-agency-web/memory/credentials.md` for all secrets.
2. Use the SSH key at `~/.ssh/tma_deploy` to reach the server.
3. Use `gh` CLI (already authenticated as `primovera12`) to manage the deploy repo + secrets.
4. Use the Coolify API token to make app/env/deploy changes without touching the dashboard.
5. Push to `deploy` remote to trigger a deploy.
