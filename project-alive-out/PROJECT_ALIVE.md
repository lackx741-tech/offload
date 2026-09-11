# Project Alive — St3

> **ALIVE-READY — npm run start**

- Path: `/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3`
- Generated: 2026-08-26T06:57:50.725Z
- Tool: project-alive v2.0.0
- Maturity: **healthy** (96/100)
- Pending score: **8/100** (`alive_ready`)
- Fingerprint: `d3d247dd292a`

## Executive summary

- St3 — maturity healthy (96/100)
- Stack: javascript/typescript / npm / next, react, web3
- Pending score: 8/100 (higher = more stuck) — 0 critical, 1 major
- Primary entry: npm run start
- Env must-change keys: 18 (2 missing)
- Docs: .cartograph/SETUP.md, COMPLETE_SETUP_STATUS.md, SETUP.md

## Why it's pending (ranked blockers)

| Sev | Issue | Fix | Effort |
|-----|-------|-----|--------|
| major | High incomplete-code signal (44 TODO/FIXME/stub hits in 43 files) | `Triage TODOs; ship MVP path first; ignore non-blocking chores` | varies |

### MAJOR: High incomplete-code signal (44 TODO/FIXME/stub hits in 43 files)

- Evidence: sampled source markers
- Fix:
```bash
Triage TODOs; ship MVP path first; ignore non-blocking chores
```

## Revive plan (copy-paste)

Estimated: **5–20 min**

### Orient (source of truth)

```bash
cd "/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3"
project-alive all . --out ./project-alive-out
ls -la
test -f README.md && head -40 README.md || true
```

### Check toolchain

```bash
node -v   # need >=18 or engines field
docker version
```

### Install dependencies

```bash
npm install
```

### Operator config (.env)

```bash
# create .env from docs / project-alive handoff section
# edit .env — fill critical keys (DB, secrets, keys, bot tokens)
```

### Local infra

```bash
docker compose up -d
# or only: docker compose up -d redis postgres
```

### Boot primary entrypoint

```bash
npm run start
```

### Verify

```bash
npm run lint
```

## Primary entrypoint

```bash
npm run start
```
- detail: `next start`
- kind: `npm-script`

### Other entrypoints

- `npm run dev` (npm-script/dev)
- `npm run start` (npm-script/start)
- `npm run dev --workspace=@waas/sdk` (workspace-script/@waas/sdk:dev)
- `npm run build --workspace=@waas/sdk` (workspace-script/@waas/sdk:build)
- `["node", "server.js"]` (docker/CMD)
- `docker compose up app` (compose/app)
- `docker compose up redis` (compose/redis)
- `docker compose up zookeeper` (compose/zookeeper)
- `docker compose up kafka` (compose/kafka)
- `docker compose up indexer` (compose/indexer)
- `docker compose up redis_data` (compose/redis_data)
- `docker compose up zk_data` (compose/zk_data)
- `docker compose up kafka_data` (compose/kafka_data)
- `npm run sdk:sync` (npm-script/sdk:sync)
- `npm run compile:sdk` (npm-script/compile:sdk)
- `npm run build` (npm-script/build)
- `npm run lint` (npm-script/lint)
- `npm run telegram:webhook` (npm-script/telegram:webhook)
- `npm run worker:telegram` (npm-script/worker:telegram)
- `npm run worker:compile` (npm-script/worker:compile)
- `npm run worker:relay` (npm-script/worker:relay)
- `npm run worker:notify` (npm-script/worker:notify)
- `npm run workers` (npm-script/workers)

## Stack

```json
{
  "languages": [
    "javascript/typescript"
  ],
  "packageManager": "npm",
  "frameworks": [
    "next",
    "react",
    "web3"
  ],
  "runtimes": [
    "node >=22"
  ],
  "infra": [
    "docker",
    "vercel"
  ],
  "monorepo": false
}
```

## Docs (ranked)

- `.cartograph/SETUP.md` — Setup — St3 (score 50)
- `COMPLETE_SETUP_STATUS.md` — St3 + VPS Backend - Complete Setup Status (score 50)
- `SETUP.md` — Setup Guide — Full Stack (score 50)
- `TELEGRAM_BOT_SETUP.md` — 🤖 St3 Premium Telegram Bots Setup Guide (score 50)
- `.cartograph/analyzer/St3/SETUP_INSTRUCTIONS.md` — Setup Instructions — St3 (score 45)
- `ENV_SETUP.md` — StealthV26 Environment Variables Setup (score 45)
- `deploy/SETUP_VPS.md` — StealthV26 (St3) — VPS Deployment Guide (BullMQ Runtime) (score 40)
- `PyTelegramClientCopier/README.md` — Telegram Client Copier (score 30)
- `Affliate and admin/README.md` — React + TypeScript + Vite (score 25)
- `DEPLOY.md` — StealthV26 WaaS — Deployment Guide (score 25)
- `QUICK_START.md` — ST3 Drainer System - Quick Start (score 25)
- `README.md` — St3 (score 25)
- `docs/PRODUCTION_DEPLOYMENT.md` — StealthV26 WaaS — Production Deployment Specification (PDS) (score 25)
- `test-dapp-site/README.md` — vinext-starter (score 25)
- `vercel-demo/README.md` — St3 Drainer Demo - Vercel Deployment (score 25)

## New operator / handoff keys

Must-change: **18** (missing 2)

### money_route (1)

- `OWNER_ADDRESS` — SET

### execution_keys (1)

- `RELAYER_PRIVATE_KEY` — SET

### auth_panel (2)

- `ENCRYPTION_KEY` — SET
- `JWT_SECRET` — SET

### alerts (5)

- `TELEGRAM_ADMIN_CHAT_IDS` — SET
- `TELEGRAM_BOT_TOKEN` — SET
- `TELEGRAM_CHAT_ID` — SET
- `TELEGRAM_TEST_CHAT_ID` — MISSING_OR_PLACEHOLDER
- `TELEGRAM_WEBHOOK_SECRET` — SET

### hosting (9)

- `DRAINER_BACKEND_URL` — SET
- `MONGO_DB` — SET
- `MONGO_URI` — SET
- `NEXT_PUBLIC_API_URL` — SET
- `NEXT_PUBLIC_APP_URL` — SET
- `NEXT_PUBLIC_SEQUENCE_API_URL` — MISSING_OR_PLACEHOLDER
- `REDIS_URL` — SET
- `VITE_SUPABASE_ANON_KEY` — SET
- `VITE_SUPABASE_URL` — SET

### providers_rpc (7)

- `ARBITRUM_RPC_URL` — SET
- `AVALANCHE_RPC_URL` — SET
- `BASE_RPC_URL` — SET
- `BSC_RPC_URL` — SET
- `ETHEREUM_RPC_URL` — SET
- `OPTIMISM_RPC_URL` — SET
- `POLYGON_RPC_URL` — SET

### other_operator_relevant (18)

- `ADMIN_LOGIN_PASSPHRASE` — MISSING_OR_PLACEHOLDER
- `ADMIN_PANEL_PASSWORD` — SET
- `AUTH_SECRET` — SET
- `BOT_TOKEN` — MISSING_OR_PLACEHOLDER
- `NEXT_PUBLIC_AFFILIATE_URL` — SET
- `NEXT_PUBLIC_BASE_URL` — SET
- `NEXT_PUBLIC_NOTIFY_URL` — SET
- `NEXT_PUBLIC_RELAY_URL` — SET
- `NEXT_PUBLIC_SEQUENCE_EXCHANGE_WALLET_ADDRESS` — MISSING_OR_PLACEHOLDER
- `NEXT_PUBLIC_SEQUENCE_INDEXER_URL` — MISSING_OR_PLACEHOLDER
- `NEXT_PUBLIC_SEQUENCE_METADATA_URL` — MISSING_OR_PLACEHOLDER
- `NEXT_PUBLIC_SEQUENCE_PROJECT_ACCESS_KEY` — MISSING_OR_PLACEHOLDER
- `NEXT_PUBLIC_SEQUENCE_RELAYER_URL` — MISSING_OR_PLACEHOLDER
- `NEXT_PUBLIC_SEQUENCE_WAAS_CONFIG_KEY` — MISSING_OR_PLACEHOLDER
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — SET
- `REDIS_PASSWORD` — MISSING_OR_PLACEHOLDER
- `VERCEL_OIDC_TOKEN` — SET
- `VITE_WALLETCONNECT_PROJECT_ID` — SET

## Git

```json
{
  "present": true,
  "branch": "master",
  "dirtyFiles": 15,
  "remote": null
}
```

## Re-run

```bash
project-alive all "/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3"
project-alive pending .
project-alive revive .
```
