# Configuration flow

## Persisted configuration stores

| Config system | Writer / validation | Storage and reader | Runtime effect |
|---|---|---|---|
| Compile config | `POST /api/compile-config` checks `isCompileConfig()` then `writeCompileConfig()` (`src/app/api/compile-config/route.ts:21–46`). Compile POST also saves merged config if `saveConfig` is true (`src/app/api/compile/route.ts:100–108`). | `data/compile-config.json`; defaults when absent/read fails (`src/lib/compile-config-store.ts:38–89`). Compile page hydrates it; compile, live SDK and workers read it (`src/app/compile/page.tsx:39–63`; `src/lib/live-compile-bundle.ts:22–55`; `workers/compile.worker.ts:23–47`). | General/wallet/modal/tokens/advanced and compile-side payout/contracts/strategy/AppKit influence bundle generation. |
| Operational config | `/api/operational-config` merges defaults or accepts config (`src/app/api/operational-config/route.ts:13–42`); `/api/compile` writes merged payout into this store (`route.ts:100–108`). | `data/operational-config.json`; read/merge/default and JSON write in `src/lib/operational-config-store.ts:31–79`. | Contracts, strategy, payout, AppKit/runtime used by compile, relay, live SDK, APIs. |
| Frontpage config | `/api/config` validates via `isFrontpageConfig()` then calls `writeFrontpageConfig()` (`src/app/api/config/route.ts:54–80`). | `data/frontpage-config.json` (`src/lib/frontpage-config-store.ts:5–62`). GET also returns runtime platform config and contract registry. | Frontpage runtime; compile sync into compile UI; separate frontpage compiler takes its config in request. |
| Affiliate project config | Affiliate config routes validate permitted SDK fields and call `saveAffiliateConfig()` (`src/app/api/affiliate/config/route.ts`; `src/lib/schemas/sdk-config.schema.ts`). | Redis project/config/version keys in `src/lib/projects.ts:236–280`; projects also stored in Redis (`:99–139`). | Affiliate compile and dynamic script generation read it; defaults fill missing config. |
| Custom contract imports | `/api/contracts/import` validates nonempty ABI array and writes `customContracts` into operational config (`src/app/api/contracts/import/route.ts:14–63`). | Nested JSON in `data/operational-config.json`. | Import UI can list/remove saved records; no code merges this array into `CONTRACT_REGISTRY` or statically selects it in `getContractById`. |
| Zustand dashboard state | Component setter methods merge partial config (`src/lib/store.ts:37–76,79–147`). | In-memory client store; no persistence middleware in `store.ts`. | Compile UI and previews; persisted only when sent to APIs. |
| Browser frontpage/import state | Frontpage and contract pages use browser `localStorage` (`src/app/frontpage/page.tsx`, `src/app/frontpage/runtime/page.tsx`, `src/app/contract/page.tsx`). | Browser `localStorage`, keys declared in source. | Local drafts/import history and runtime page restoration; not server-side persistent state. |
| Telegram bot sessions | `saveTelegramBotSession()`/`clearTelegramBotSession()` | Redis key generated from chat ID (`src/lib/telegram-bot-store.ts:16–69`). | `/me`, `/login`, `/logout`, project-scoped commands. |
| Auth | Nonce/session routes write cookies; auth helpers sign/verify them. | HTTP cookies (`src/app/api/auth/{nonce,verify,logout,me}/route.ts`; `src/lib/auth.ts`). | Middleware checks `s26_session`; API guards use session and RBAC. |

## Environment-derived values

Environment variables are read directly by runtime modules: `REDIS_URL`, `DISABLE_REDIS`, `DISABLE_QUEUES`, `RELAY_QUEUE_ENABLED`, RPC URLs, `RELAYER_PRIVATE_KEY`, Kafka brokers, Telegram secrets/tokens/chat IDs, auth/encryption credentials, app base URLs, and public wallet project IDs. They are not all stored in a single config file. Worker `.env` loading is non-overriding (`workers/env.ts:8–23`); Compose injects Redis/Kafka URLs (`docker-compose*.yml`).

## Multiple readers and precedence

- `/api/compile` merges defaults, operational values and request fields; request values are last for applicable nested config (`src/app/api/compile/route.ts:31–48`).
- `generateLiveSdkBundle` merges persisted compile config and operational values, and merges bindings by preset (`src/lib/live-compile-bundle.ts:22–55`).
- `compileAffiliateProject` reads project-specific general/wallet/modal/tokens/advanced config but uses defaults for contracts/strategy/AppKit (`src/lib/affiliate-compile.ts:43–53`); affiliate POST compile separately uses operational contracts/strategy/AppKit (`src/app/api/affiliate/compile/route.ts:51–72`).
- The compile worker's platform path reads saved config and operational config rather than job payload configuration (`workers/compile.worker.ts:23–47`).

Those distinct merge paths are evidenced behavior, not an inferred unified source-of-truth.
