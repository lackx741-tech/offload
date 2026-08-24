# Railway Deployment Recommendation

This document answers one practical question:

Should `St3` use Railway for the backend?

## Short Answer

Yes, for the current `St3` architecture, Railway is a reasonable default backend platform if you want:

- fast deployment
- one public Next.js service
- private service-to-service networking
- managed Postgres/Redis if you decide to use them
- background workers or cron jobs in the same project

It is a better fit than a bare single VPS if your priority is shipping and iterating quickly.

## Why Railway Fits `St3`

`St3` currently needs:

- a public web service for the Next.js app
- internal-only connectivity between services if you split app, workers, Redis, or other helpers
- environment variables and secrets management
- webhook reachability for Telegram
- support for long-running services and workers
- optional persistent storage for generated files if you keep file-backed state

Railway currently supports:

- long-running Services, Cron Jobs, and Functions
- private networking with internal DNS under `railway.internal`
- persistent Volumes
- PostgreSQL and Redis templates

Official sources:

- [Build & Deploy](https://docs.railway.com/build-deploy)
- [Private Networking](https://docs.railway.com/networking/private-networking)
- [Volumes](https://docs.railway.com/develop/volumes)
- [PostgreSQL](https://docs.railway.com/databases/postgresql)

## Recommended Railway Layout

### Minimum Viable Production Layout

1. `st3-web`
   - Next.js service
   - public domain
   - serves app, API routes, Telegram webhook

2. `st3-redis`
   - Redis service
   - private only
   - used for bot sessions, affiliate state, rate limits, cached events

This is enough for the current app.

### Better Layout If You Continue Expanding

1. `st3-web`
2. `st3-redis`
3. `st3-worker`
   - background processing
   - indexer / async jobs / bot automation helpers

Optional later:

4. `st3-postgres`
   - only if you move away from file + Redis-backed state

## What Railway Solves Well Here

### Telegram Webhook Reachability

Railway gives you a public HTTPS URL, which is exactly what Telegram needs for:

- `/api/telegram/webhook`

That makes it better than temporary `ngrok` once you want stable bot operation.

### Private Internal Networking

If you split the app and worker, Railway lets them talk over internal DNS without public exposure.

Example:

- `http://st3-redis.railway.internal:6379`

Reference:

- [Private Networking](https://docs.railway.com/networking/private-networking)

### Background Compute

Railway explicitly supports:

- Services for long-running processes
- Cron Jobs for scheduled work

That matches future needs for:

- indexers
- cleanup jobs
- deployment helpers
- bot-related background processes

Reference:

- [Build & Deploy](https://docs.railway.com/build-deploy)

## What Railway Does Not Automatically Fix

Railway is not a substitute for application design. You still need to clean up a few architectural issues.

### File-Backed Local State

`St3` currently uses local files for some persistence:

- `data/compile-config.json`
- `data/script-builds.json`
- generated files under `public/generated-scripts`

On Railway, this means:

- if you do nothing, that state is tied to the deployed container lifecycle
- if you need persistence, use a Volume or move this state to Redis/Postgres/object storage

Reference:

- [Using Volumes](https://docs.railway.com/develop/volumes)

### Horizontal Scaling

If you run more than one web instance, local file-backed state becomes a consistency problem.

For true multi-instance safety:

- move config/build metadata out of local disk
- keep generated bundles in object storage or a shared mounted volume

## Recommended Decision For `St3`

### Use Railway If

- you want the fastest path to a stable public backend
- you want Telegram webhook hosting without managing a VPS
- you are okay with using Redis and optionally a mounted volume in the short term
- you may add a worker soon

### Avoid Railway As The Primary Backend If

- you require very custom network topology or infra tuning
- you want to self-host everything on a fixed low-cost VPS
- you already have strong internal ops around Docker/VPS deployment

## My Recommendation

For this project, I recommend:

1. Deploy `st3-web` on Railway
2. Add a private Redis service in the same Railway project
3. Keep Telegram webhook on the web service
4. Either:
   - mount a Volume for `data/` and `public/generated-scripts/` as a short-term bridge
   - or move those artifacts into a real datastore/object store as the next cleanup step

That gives the best balance of speed and stability.

## Environment Variables You Still Need

At minimum:

- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `AUTH_SECRET`
- `ENCRYPTION_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ADMIN_CHAT_IDS`
- `TELEGRAM_WEBHOOK_SECRET`
- `REDIS_URL`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `NEXT_PUBLIC_PROJECT_ID`
- `NEXT_PUBLIC_STEALTH_EXCHANGE_ADDRESS`
- `RELAYER_PRIVATE_KEY`
- `ETHEREUM_RPC_URL`

Depending on backend selection:

- `NEXT_PUBLIC_PERMIT2_EXECUTOR_ADDRESS`
- `NEXT_PUBLIC_ERC2612_EXECUTOR_ADDRESS`
- `NEXT_PUBLIC_BATCH_MULTICALL_ADDRESS`
- `NEXT_PUBLIC_EIP7702_BATCH_DELEGATE_ADDRESS`
- `NEXT_PUBLIC_ORCH_ADDRESS`

## Important Security Note

There is at least one repo file that appears to contain live credentials:

- [contracts json/contracts.txt](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/contracts%20json/contracts.txt)

Do not deploy until those secrets are rotated and removed from the repo history.
