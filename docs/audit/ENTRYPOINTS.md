# Entrypoint map

“Active” below means a framework/runtime entrypoint or a call path is present in source. It does not assert that a deployment is running or that optional credentials/services are configured.

## Process entrypoints

| Entry | Evidence | Flow / side effect |
|---|---|---|
| Development server | `package.json:13`; `scripts/dev.mjs:22–58` | `npm run dev` → `main()` selects a free port → spawns `next dev --webpack` with `NEXT_DIST_DIR`. |
| Production web server | `package.json:16–17`; `Dockerfile:53–65` | `npm run build` → standalone Next output; runner starts `node server.js` on port 3000. |
| Combined workers | `package.json:24`; `workers/run-all.ts:6–22` | `npm run workers` loads `.env.local` and `.env.development`, imports four worker modules, exits on startup failure. |
| Individual workers | `package.json:20–23` | `worker:telegram`, `worker:compile`, `worker:relay`, `worker:notify` each invokes `tsx` on one worker file. |
| Blockchain indexer | `docker-compose*.yml`; `services/indexer/index.mjs:12–23,152–196` | Separate Node process polls RPC, publishes event records to Kafka and caches progress/events in Redis. |
| Dashboard compile CLI | `package.json:15`; `scripts/dashboard-compile.mjs:20–55` | Reads `data/compile-config.json`, POSTs `/api/compile`, prints bundle metadata. Requires a running server. |
| Generated SDK sync CLI | `package.json:14`; `scripts/sync-generated-sdk.ts:1–21` | Calls `generateLiveSdkBundle()`, then `saveScriptBuild()`. |
| Telegram webhook registration CLI | `package.json:19`; `scripts/register-telegram-webhook.mjs:1–35` | Calls Telegram `setWebhook` for `/api/telegram/webhook`. |

## Next.js page entrypoints

Route pages under `src/app/**/page.tsx` are active Next route modules: `/`, `/admin-settings`, `/affiliate`, `/affiliate/admin`, `/affiliates`, `/analytics`, `/compile`, `/contract`, `/contracts-import`, `/demo`, `/dex-test`, `/domains`, `/embed-tool`, `/frontpage`, `/frontpage/runtime`, `/login`, `/logs`, `/permit2`, `/queues`, `/sdk-self-test`, `/sessions`, `/settings`, `/strategy`, `/templates`, `/wallet-runtime`, `/wallet-test`. Filesystem route mapping is the entry mechanism; page contents and their downstream API links are catalogued in `REPOSITORY_TREE.md`, `DASHBOARD_TO_SCRIPT.md`, and `FILE_RELATIONSHIPS.md`.

The root layout providers are established in `src/app/layout.tsx:32–60`. `src/middleware.ts:4–49` applies cookie gating for paths not in its public-route allowlist.

## API route entrypoints

All 45 `route.ts` modules under `src/app/api/` are Next route handlers. Method handlers discovered:

| Endpoint | Methods / handler behavior |
|---|---|
| `/api/action/execute` | GET preset list; POST action execution. |
| `/api/admin/access` | POST admin access. |
| `/api/affiliate/access` | POST affiliate access. |
| `/api/affiliate/compile` | POST synchronous script generation and response. |
| `/api/affiliate/config` | PUT affiliate config. |
| `/api/affiliate/onboard` | POST onboarding. |
| `/api/analytics` | GET analytics. |
| `/api/auth/logout`, `/api/auth/verify` | POST session mutation/verification. |
| `/api/auth/me`, `/api/auth/nonce` | GET session/nonce. |
| `/api/compile` | GET config/build listing; POST sync compile or optional queue producer (`src/app/api/compile/route.ts:50–95`). |
| `/api/compile/status/[jobId]` | GET compile queue job state/result. |
| `/api/compile-config` | GET/POST compile config. |
| `/api/compile-test` | POST test compile. |
| `/api/config` | GET platform/frontpage config and registry summary; POST frontpage config. |
| `/api/contracts`, `/api/contracts/[id]` | GET runtime artifact listing/detail. |
| `/api/contracts/import` | GET/POST/DELETE persisted custom contract records. |
| `/api/domains` | GET/POST/PATCH/DELETE domain data. |
| `/api/frontpage/compile` | POST standalone frontpage script compile/save/return. |
| `/api/health` | GET health status. |
| `/api/indexer` | GET stats/events; POST watch-address operation. |
| `/api/logs` | GET/POST logs. |
| `/api/notify` | POST direct-or-queued Telegram notification. |
| `/api/operational-config`, `/api/platform-config`, `/api/settings` | GET/POST configuration APIs. |
| `/api/projects` | GET/POST projects. |
| `/api/projects/[id]` | GET/PATCH/DELETE project. |
| `/api/projects/[id]/compile` | GET synchronous affiliate compile. |
| `/api/projects/[id]/config` | GET/PUT project config. |
| `/api/projects/[id]/reset-password` | POST password reset. |
| `/api/projects/[id]/stats` | GET project analytics. |
| `/api/queues` | GET BullMQ inspection. |
| `/api/relay/batch`, `/api/relay/status` | POST synchronous chain relay; GET relay status. |
| `/api/script` | GET dynamic affiliate JavaScript. |
| `/api/script/generate-drainer` | GET download; POST generation JSON. |
| `/api/sdk` | GET generated current-config JavaScript. |
| `/api/submit-drainer` | GET/POST drainer submission/status. |
| `/api/telegram` | POST direct test send/notification. |
| `/api/telegram/webhook` | GET diagnostics/register commands; POST authorized update, queue or inline. |
| `/api/telegram/affiliate/[token]` | POST affiliate-bot update. |
| `/api/tx-payload` | GET/POST transaction payload. |

## Selected request-to-effect traces

```text
POST /api/compile
  → POST() in src/app/api/compile/route.ts:64–260
  → queue branch enqueueCompileJob(), OR inline merge/config + generator
  → saveScriptBuild() when saveBuild is true
  → JSON with bundle and build metadata

POST /api/telegram/webhook
  → POST() in src/app/api/telegram/webhook/route.ts:21–46
  → secret check → enqueueTelegramInbound() OR processTelegramUpdate()
  → telegram-inbound worker → command handler
  → command-specific Redis/config/compile/notification effect

POST /api/frontpage/compile
  → compileFrontpagePayload()
  → compileFrontpageScript() / esbuild
  → saveScriptBuild() → JSON containing script

GET /api/script?configId=...
  → active project/config reads → generateSDKBundle()
  → obfuscation → hit counters / Kafka event → JavaScript response

GET /api/sdk
  → generateLiveSdkBundle() from persisted + operational config
  → optional obfuscation → JavaScript response
```

Evidence: `src/app/api/frontpage/compile/route.ts:6–27`; `src/lib/frontpage-compile-service.ts:5–21`; `src/app/api/script/route.ts:30–118`; `src/app/api/sdk/route.ts:14–32`; worker path details in `QUEUE_GRAPH.md`.

## Separate or unproven entrypoints

`packages/sdk`, `project/`, `Affliate and admin/`, `affiliate-app/`, `standalone/`, `vercel-demo/`, and `web3-platform/` have package/build/source files, but no root process import was found that starts them as part of the primary Next server. Their independent runtime status is `UNKNOWN` absent execution evidence.
