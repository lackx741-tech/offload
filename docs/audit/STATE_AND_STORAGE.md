# State and storage map

| State object | Writer | Storage / identifier | Reader | Lifetime / runtime effect |
|---|---|---|---|---|
| Compile configuration | `/api/compile-config` POST; `/api/compile` when `saveConfig` | JSON `data/compile-config.json` | Compile page, compile route, live bundle, compile worker | Persists across process restarts when filesystem volume persists; missing/invalid read falls back to defaults (`src/lib/compile-config-store.ts:38–89`). |
| Operational config | `/api/operational-config`; compile route payout propagation; custom contract import | JSON `data/operational-config.json` | compile/worker/live SDK/relay/config routes | Persisted JSON (`src/lib/operational-config-store.ts:31–79`). |
| Frontpage config | `/api/config` POST | JSON `data/frontpage-config.json` | `/api/config` GET, frontpage sync/runtime | Persists on filesystem; validation/default behavior in `frontpage-config-store.ts:5–62`. |
| Affiliate project record | Project CRUD APIs, Telegram project mutations | Redis key from `KEY.project(id)`, with ID `aff_<random>` | project APIs, compiler, Telegram, `/api/script` | Redis-managed; lifecycle depends on Redis durability (`src/lib/projects.ts:64–89,99–139,203–230`). |
| Affiliate SDK config | Affiliate config routes | Redis project config and version keys; project ID | affiliate compile, dynamic script, Telegram compile | Config versions retained as Redis keys (`projects.ts:236–280`). |
| Custom ABI records | `/api/contracts/import` POST/DELETE | `customContracts` property of operational config JSON | `/api/contracts/import` GET | Persists as operational JSON. No merge into static contract registry is shown (`src/app/api/contracts/import/route.ts:35–50,66–78`). |
| Script build contents | compile routes/workers/CLI | Files in `.builds/`, filename; atomic temp + rename | `listScriptBuilds()`, `readBuild()`; route outputs metadata/URL | Filesystem lifetime; cleanup method exists but no periodic caller proven (`src/lib/script-build-store.ts:33–37,100–141,149–172`). |
| Static generated scripts | External/build process or checked-in output | `public/generated-scripts/*.min.js` | Next static serving and embed URLs | Static files are present; exact writer/copy process not proven from `saveScriptBuild`. |
| Script-build index JSON | Exists in checkout at `data/script-builds.json` | File | No reader/writer found in primary runtime search; `script-build-store` derives list by `.builds` directory scan. | `UNKNOWN`/not proven active. |
| BullMQ jobs | Queue producers | Redis/BullMQ keys, queue name and job ID | matching workers, compile status API, queue monitor | Retry/retention options in queue producers; job records expire per configured retention (`src/lib/queues/index.ts:59–78`). |
| Telegram bot session | `/login`, `/logout` handlers | Redis key `telegram:bot:<chatId>` | `/me`, `/compile`, `/domains`, other session-scoped commands | Redis-managed; no TTL in `telegram-bot-store.ts:16–69`. |
| Rate limit counters | `rateLimit()` calls | Redis or in-memory fallback key | same limiter call sites | TTL/window supplied by route; e.g. `/api/notify` uses 20 requests/60 sec (`src/app/api/notify/route.ts:17–25`; `src/lib/redis.ts:105–115`). |
| Dynamic script-load metrics | `/api/script` | Redis `hits:<configId>:<day>`, total and domain counters | analytics/project stats routes | Incrementing counters; no expiration shown (`src/app/api/script/route.ts:49–64`). |
| Indexer cursor/events/stats | `services/indexer/index.mjs` | Redis `indexer:lastBlock`, `events:<address>`, `indexer:stats` | indexer restart, API indexer route | Cursor survives process restarts if Redis persists; events list capped to 100 per address (`index.mjs:32–44,47–62,128–132`). |
| Event bus messages | Routes/indexer | Kafka topic messages if configured; in-memory fallback otherwise | Kafka consumers/subscribers; indexer | Kafka retention configured in Compose; in-memory bus is process-local (`src/lib/kafka.ts:41–100`; compose config). |
| Auth nonce/session | auth routes | HTTP cookies (`s26_nonce`, `s26_session`) | auth helpers, middleware, API auth/RBAC | Browser cookie policy/expiry set by route (`src/lib/auth.ts`; `src/app/api/auth/*/route.ts`; `src/middleware.ts:27–35`). |
| Dashboard form state | Tab setters/hydration | Zustand process/page memory | CompileOutput and panels | Client lifetime unless an API save/hydrate occurs (`src/lib/store.ts:37–76,79–160`). |
| Frontpage draft/import records | frontpage/contract pages | Browser `localStorage` keys `FRONT_PAGE_CONFIG_KEY`, saved imports | same pages/runtime | Browser-specific; not readable by server without request data. |
| Environment configuration | deployment/runner/operator | Process environment; optional `.env.local`/`.env.development` for workers | modules calling `process.env` | Process lifetime; worker loader avoids overriding existing values (`workers/env.ts:8–23`). |

## Persistence boundaries

Redis, filesystem JSON, `.builds`, public static files, browser storage, cookies, Kafka and BullMQ each have distinct identifiers and readers. There is no evidence that the checked-in `data/script-builds.json` is the active index for output records; active build listing scans `.builds` (`src/lib/script-build-store.ts:52–92`).
