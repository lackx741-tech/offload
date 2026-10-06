# Telegram flow

## Platform-bot ingress

```text
Telegram webhook POST
  → /api/telegram/webhook POST
  → isTelegramWebhookAuthorized(secret header)
  → queue mode: enqueueTelegramInbound(update), 200 response
      → telegram-inbound Worker
      → processTelegramUpdate(update)
  → queue disabled: processTelegramUpdate(update) inline
  → handleCommand(chatId,text) OR handleCallback(query)
```

Evidence: webhook route `src/app/api/telegram/webhook/route.ts:21–45`; queue settings `src/lib/queues/index.ts:54–57`; worker `workers/telegram.worker.ts:17–26`; dispatcher `src/lib/telegram-bot.ts:987–1128,1130–1229`. The platform bot checks an admin-chat allowlist; if empty, `isAdminChat()` allows all chats (`telegram-bot.ts:121–125`).

## Platform commands

`handleCommand()` dispatches each listed command at `src/lib/telegram-bot.ts:987–1128`. Each call responds through its local `sendMessage` helper (Telegram HTTP; `telegram-bot.ts` platform API helper around lines 158–190).

| Command | Handler / reads | Service/queue/output and response |
|---|---|---|
| `/start` | `sendWelcome()`; bot diagnostics/session behavior | Sends welcome/menu. `:998–1000`. |
| `/help` | `sendHelp()` | Sends command reference. `:1002–1004`. |
| `/me` | `getTelegramBotSession(chatId)` | Formats and sends current session summary. `:1006–1010`; store at `telegram-bot-store.ts:36–44`. |
| `/logout` | `clearTelegramBotSession(chatId)` | Deletes Redis session then replies “Session cleared.” `:1012–1015`; store `telegram-bot-store.ts:67–69`. |
| `/ops` | `sendOpsDashboard()` | Operational helper reads health/relay/builds/stats dependencies and sends dashboard. `:1017–1020`; helper group `:433–499`. |
| `/health` | `sendHealthDetail()` | Health details and Telegram response. `:1022–1024`; helper `:501–528`. |
| `/relay` | `sendRelayDetail()` | Relayer status details and response. `:1026–1028`; helper `:530–560`. |
| `/builds` | `sendBuildsDetail()` / `listScriptBuilds()` | Reads `.builds` inventory and sends recent build summaries. `:1030–1032`; helper `:562–595`; store `src/lib/script-build-store.ts:74–92`. |
| `/stats` | `sendStatsDetail()` | Reads analytics/stats service data and sends summary. `:1034–1036`; helper `:597–631`. |
| `/logs [n]` | Parses `n`, defaults to 5, `sendLogsDetail()` | Reads recent log records and sends them. `:1038–1042`; helper `:633–679`. |
| `/login <username> <password>` | `handleAffiliateLogin()` → username-index and project lookup, status/password check | Saves chat session in Redis and sends project menu. `:1045–1051`; implementation `:751–782`; project Redis functions `src/lib/projects.ts:160–183`; session store `telegram-bot-store.ts:48–64`. |
| `/status [projectId]` | Session lookup for fallback project ID; `sendProjectSummary()` | Reads project/config version/build/project status and sends summary. `:1053–1062`; helper `:681–716`. |
| `/compile [projectId] [level]` | `handleCompileCommand()` resolves explicit ID or Telegram session project | Queue enabled: enqueues compile job, sends queued/job ID; otherwise synchronous affiliate compile, saves build and sends completion URL, then best-effort notification. `:1064–1066`; full flow `:784–863`. |
| `/domains` | `handleDomainsCommand()` reads Telegram session/project | Sends domain list. `:1068–1070`; helper `:865–884`. |
| `/add-domain <domain>` | `handleDomainMutation(...,"add")`, project read, normalization/validation | Updates project Redis record and sends result. `:1072–1078`; helper `:886–915`. |
| `/remove-domain <domain>` | `handleDomainMutation(...,"remove")` | Updates project Redis record and sends result. `:1080–1086`; helper `:886–915`. |
| `/projects` | `handleAdminProjects()` → project list | Sends project summaries. `:1088–1091`; helper `:917–946`. |
| `/project <id>` | `sendProjectSummary(id)` | Reads and sends project data. `:1093–1099`; helper `:681–716`. |
| `/pause <id>` | `handleProjectStatusMutation(id,"paused")` | Updates project status in Redis; sends new status. `:1101–1107`; helper `:948–963`. |
| `/resume <id>` | `handleProjectStatusMutation(id,"active")` | Updates project status; sends new status. `:1109–1115`; helper `:948–963`. |
| `/notify <id> <message>` | `handleNotifyCommand()` → `sendTelegramNotification()` | Direct platform/project Telegram fan-out; sends delivery flags back to command chat. It does not call `enqueueNotifyJob`. `:1117–1123`; handler `:965–983`. |

Inline callback data is separately dispatched by `handleCallback()` (`telegram-bot.ts:1130–1209`): menu shortcuts call ops/health/relay/builds/stats/projects; project callbacks query project summary/stats/domains; `compile` invokes `handleCompileCommand`; `status` may update project status. Every handler sends callback acknowledgements and/or message responses.

## Compile command to generated file

When `isQueueEnabled()` is true, `handleCompileCommand()` calls `enqueueCompileJob({projectId, obfuscationLevel, source:"telegram", chatId, includeButton:true})` (`telegram-bot.ts:802–816`). `workers/compile.worker.ts:57–90` consumes it. For `aff_*`, it calls `compileAffiliateProject({publishBuild:true})`; that reads project/config, selects ecosystem generator, obfuscates/domain-locks, updates `lastCompiled`, and calls `saveScriptBuild()` (`src/lib/affiliate-compile.ts:32–112`). Worker then sends completion through `sendTelegramApiMessage()` (`workers/compile.worker.ts:62–76`). The worker's completion URL concatenates base URL and returned build URL (`:61,68–74`).

If queue mode is off, `handleCompileCommand()` calls `compileAffiliateProject()` inline and sends completion directly (`telegram-bot.ts:819–862`). Neither path uses `/api/compile` platform configuration for affiliate compilation.

## Affiliate-bot webhook is a different route

`POST /api/telegram/affiliate/[token]` optionally checks `TELEGRAM_WEBHOOK_SECRET`, extracts token/update and invokes `processAffiliateUpdate()` directly; it does not enqueue a Telegram queue job (`src/app/api/telegram/affiliate/[token]/route.ts:21–60`). The handler resolves token against encrypted project bot tokens in Redis (`src/lib/telegram-affiliate-bot.ts:128–153`), then dispatches `/start`, `/help`, `/status`, `/compile`, `/domains`, `/add-domain`, `/remove-domain` (`:296–338`).

Affiliate `/compile` calls `compileAffiliateProject(..., publishBuild:true)` synchronously and sends an inline “Open Script” link (`telegram-affiliate-bot.ts:205–245`). Domain commands read/update the associated project (`:247–292`). Callbacks cover status/compile/domains (`:340–368`).

## Other Telegram routes/services

- `GET /api/telegram/webhook` registers command metadata and returns diagnostics (`src/app/api/telegram/webhook/route.ts:11–19`).
- `POST /api/telegram` is a direct test-send/notification endpoint (`src/app/api/telegram/route.ts:5–70`); not queued.
- `POST /api/notify` queues only when queue mode enabled; otherwise invokes `sendTelegramNotification` directly (`src/app/api/notify/route.ts:37–54`).
- `sendTelegramNotification()` attempts platform and optional affiliate send in parallel (`src/lib/telegram.ts:66–79`).
- The platform compile worker completion uses direct Bot API HTTP, not `telegram-outbound` (`workers/compile.worker.ts:50–55`; `src/lib/queues/telegram.ts:50–76`).
