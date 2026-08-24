# StealthV26 (St3) — VPS Deployment Guide (BullMQ Runtime)

Last updated: 2026-08-16 · Companion to docs/PRODUCTION_DEPLOYMENT.md

Deploys the St3 dashboard PLUS the BullMQ worker runtime (telegram, compile,
notify, relay queues) on a single VPS. Assumes local build already verified.

## 1. Architecture on the VPS

```text
Internet ---> Nginx (443/80) ---> app :3000 (dashboard + API + webhook)
                              |--- Redis (BullMQ bus + sessions + stats)
                              |--- Kafka (optional event bus)
                              |--- workers (telegram, compile, notify, relay)
                              +--- volumes: data/ + public/generated-scripts/
```

The compile -> .js -> Telegram inline button flow:

1. Bot /compile aff_xxx -> webhook -> telegram-inbound queue
2. telegram.worker -> handleCompileCommand -> enqueues compile job -> replies "Compile queued"
3. compile.worker -> generates + obfuscates + publishes stealthv26-*.min.js
4. Worker sends completion message with inline [Open Script] button

## 2. Prerequisites

- VPS: Ubuntu 22.04/24.04, 2 GB RAM minimum (4 GB recommended), public IP + domain
- DNS: point your dashboard domain and relay domain at the VPS IP
- Node.js 22 (.nvmrc = 22) and Redis 7+ (or use the Docker stack which includes it)
