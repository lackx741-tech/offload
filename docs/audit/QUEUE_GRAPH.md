# BullMQ queue graph

Queue names, Redis configuration, job defaults and lazy queue creation are in `src/lib/queues/index.ts:14–84`. Workers are separate Node processes started by `workers/run-all.ts:6–17` or individual npm scripts (`package.json:20–24`). Queue mode is on unless `DISABLE_QUEUES` matches `1|true|yes` (`index.ts:54–57`).

## Producer → queue → consumer → side effect

| Queue / status | Producer and call site | Consumer | Result / side effect |
|---|---|---|---|
| `telegram-inbound` — **active producer + consumer** | `POST /api/telegram/webhook` → `enqueueTelegramInbound(update)` (`src/app/api/telegram/webhook/route.ts:21–38`; producer `src/lib/queues/telegram.ts:25–38`) | `workers/telegram.worker.ts:18–26`, concurrency 5 → `processTelegramUpdate(data.update)` | Dispatches commands/callbacks; project/session/config/compile/notification behavior varies by command. |
| `telegram-outbound` — **queue and consumer exist; no producer call site found** | `enqueueTelegramOutbound(message)` exists (`src/lib/queues/telegram.ts:40–44`); no imports/calls found elsewhere in repository. | `workers/telegram.worker.ts:29–38`, concurrency 10 → direct Telegram Bot API sender | Sends message via `sendTelegramApiMessage()`. Other code sends messages directly instead. |
| `compile` — **active producer + consumer** | `POST /api/compile` only when request has `queue:true` or `async:true` (`src/app/api/compile/route.ts:78–95`); Telegram `/compile` when queue mode enabled (`src/lib/telegram-bot.ts:802–816`). Both use `enqueueCompileJob()` (`src/lib/queues/compile.ts:28–41`). | `workers/compile.worker.ts:57–90`, concurrency 2 | `aff_*` calls `compileAffiliateProject()`; otherwise reads saved platform config, generates and saves build; optional direct Telegram completion send. |
| `notify` — **active producer + consumer** | `POST /api/notify`, after rate limit/validation and when queue mode enabled, calls `enqueueNotifyJob()` (`src/app/api/notify/route.ts:15–47`; producer `src/lib/queues/notify.ts:17–26`). | `workers/notify.worker.ts:9–24`, concurrency 5 | `sendTelegramNotification()` fans out to platform/project bots; worker throws if no send succeeded. |
| `relay` — **queue and consumer exist; no producer call site found** | `enqueueRelayJob()` and `isRelayQueueEnabled()` exist (`src/lib/queues/relay.ts:22–34`); no call sites found. `/api/relay/batch` does not enqueue. | `workers/relay.worker.ts:12–23`, concurrency 3 | Logs chain/backend and returns `{accepted:true,...}`; no execution side effect. `/api/relay/batch` remains synchronous (`src/app/api/relay/batch/route.ts:90–129,332–371`). |

## Retry and retention values

| Producer | Job name | Attempts/backoff/retention |
|---|---|---|
| Telegram inbound | `process-update` | 3 attempts, exponential 1,000 ms, complete age 3,600 sec/count 500, fail age 86,400 sec (`src/lib/queues/telegram.ts:25–38`). |
| Telegram outbound | `send-message` | Shared defaults (`telegram.ts:40–44`; defaults `index.ts:59–65`). |
| Compile | `compile-script` | Overrides defaults: 2 attempts, exponential base 2,000 ms; complete 3,600 sec/count 300; fail 86,400 sec/count 500 (`src/lib/queues/compile.ts:28–40`). |
| Notify | `send-notification` | 4 attempts; complete 3,600 sec/count 500; fail 86,400 sec (`src/lib/queues/notify.ts:17–25`). |
| Relay | `relay-batch` | 2 attempts; complete 3,600 sec/count 500; fail 86,400 sec (`src/lib/queues/relay.ts:26–34`). |

Default jobs have 3 attempts, exponential 2-second delay, completion retention 1 hour/200 jobs and failure retention 1 day/500 jobs (`src/lib/queues/index.ts:59–65`).

## Polling and observability

- `/api/compile/status/[jobId]` reads `compile` queue and job state (`src/app/api/compile/status/[jobId]/route.ts:14–59`).
- `/api/queues` iterates all `QUEUE_NAMES`, returns counts and up to ten recent jobs per state (`src/app/api/queues/route.ts:11–56`).
- `/queues` polls every five seconds (`src/app/queues/page.tsx:28–50`).
- Redis queue URL is `REDIS_URL` or `redis://localhost:6379`; the parser supports `rediss://` TLS (`src/lib/queues/index.ts:24–52`).
