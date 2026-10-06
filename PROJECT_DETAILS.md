# Project details: current implementation

## System overview

The repository contains a root Next.js App Router application, TypeScript source libraries, BullMQ workers, script-generation modules, contract and ABI data, and several separately packaged projects. Root package scripts launch the Next application, workers, tests and utility scripts (`package.json:8–24`). The primary generation result is JavaScript script output: route/compiler functions return source and/or save build files; a separate frontpage compiler emits a browser IIFE. Separate SDK code exists in the repository, but the root runtime's SDK generator is one of several script-generation implementation paths.

## Repository structure

- `src/app/`: Next pages and API route handlers.
- `src/components/`: dashboard, compile, affiliate and wallet UI.
- `src/lib/`: configuration stores, project/Redis services, queue producers, ABI registry, compiler/generator/runtime, auth, Telegram, relay and utilities.
- `abi/`, `contracts json/`: JSON contract/ABI sources and barrels.
- `workers/`: compile, Telegram, notification and relay BullMQ consumers; `run-all.ts` starts the worker processes when invoked.
- `scripts/`: development launcher, CLI compilation/sync, webhook registration and embed scripts.
- `data/`, `.builds/`, `public/generated-scripts/`: distinct config/state, generated build, and static script locations.
- `packages/sdk/`, `project/`, `standalone/`, `web3-platform/`, `affiliate-app/`, `Affliate and admin/`, `vercel-demo/`: additional project roots; root-runtime reachability is not established by their presence.

The detailed meaningful tree is `docs/audit/REPOSITORY_TREE.md`.

## Runtime entrypoints

`npm run dev` invokes `scripts/dev.mjs` and launches Next dev mode; production behavior uses the root Next scripts/deployment definitions (`package.json:8–24`; `scripts/dev.mjs`). Next pages and `src/app/api/**/route.ts` are framework entrypoints. `npm run workers` invokes `workers/run-all.ts`, which starts compile, notify, relay and Telegram workers (`workers/run-all.ts:6–17`). The indexer is a separate Node process under `services/indexer/`. CLI and webhook-registration scripts require their respective package/operational invocation. See `ENTRYPOINTS.md`.

## Dashboard

The root pages use client components and shared Zustand state. The compile page hydrates/synchronizes frontpage/compile config, and compile controls select contract/function, strategy, wallet and options (`src/app/compile/page.tsx:19,84–95`; `src/components/compile/contract-tab.tsx:28–65`; `src/lib/store.ts:37–76,79–160`). `CompileOutput.handleCompile()` has a local drainer branch and otherwise POSTs `/api/compile` (`src/components/compile/compile-output.tsx:203–250`). The UI does not prove queue opt-in merely by invoking compile; async queue activation is request-field gated at the API.

## Configuration

Configuration is not one unified store. Compile and operational settings are filesystem JSON in `data/compile-config.json` and `data/operational-config.json`; frontpage settings use `data/frontpage-config.json` (`src/lib/compile-config-store.ts:38–89`; `operational-config-store.ts:31–79`; `frontpage-config-store.ts:5–62`). Affiliate project/config records and Telegram sessions are in Redis (`src/lib/projects.ts:64–89,203–280`; `src/lib/telegram-bot-store.ts:16–69`). Client state, localStorage and cookies form separate browser state systems. Environment variables configure process behavior. Details: `CONFIGURATION_FLOW.md` and `STATE_AND_STORAGE.md`.

## Contract/ABI system

`src/lib/contract-registry.ts` imports 20 JSON ABIs from top-level `abi/` and three JSON artifacts from `contracts json/`; these become static registry entries (`contract-registry.ts:6–26,48–90`). `contracts json/index.ts` and `abi/index.ts` are barrels without proven application importers. Separately, `/api/contracts` dynamically scans selected filesystem roots and `/api/contracts/[id]` parses a requested artifact; `/api/contracts/import` stores custom ABIs in operational config (`src/app/api/contracts/route.ts:12–16,63–114`; `[id]/route.ts:14–20,44–88`; `import/route.ts:14–63`). Contract UI selection drives registry bindings into compile state (`src/components/compile/contract-tab.tsx:28–65`). The frontpage action compiler consumes address and method ABI embedded in action config instead of dynamically discovering the registry. See `CONTRACT_ABI_FLOW.md`.

## Script generation

The main `/api/compile` endpoint supports synchronous generation and queue opt-in (`src/app/api/compile/route.ts:64–95`). Synchronous selection merges config, resolves registry contract/binding and invokes universal/SDK, drainer, or ecosystem-specific generators before returning output and saving a build (`:100–225`). The affiliate path reads a project/config from Redis, selects a generator, obfuscates/domain-locks output, updates project metadata and optionally persists a build (`src/lib/affiliate-compile.ts:32–112`). The frontpage compile route validates action config and emits a browser bundle from compiled contract actions (`src/app/api/frontpage/compile/route.ts:6–23`; `src/lib/frontpage-script-compiler.ts:17–20,41–80,170–200`). Other generator APIs/scripts expose SDK and drainer outputs; their callers/status are enumerated in `GENERATED_OUTPUTS.md` and `DISCONNECTED_IMPLEMENTATIONS.md`.

## Telegram

The platform webhook validates the request, then enqueues inbound updates when queue mode is enabled or processes inline otherwise (`src/app/api/telegram/webhook/route.ts:21–45`). `telegram.worker.ts` consumes inbound updates and dispatches `processTelegramUpdate()`; `telegram-bot.ts` handles commands and callbacks. `/compile` either enqueues a compile job or directly calls affiliate compilation; queue worker completion uses direct Telegram Bot API HTTP (`workers/telegram.worker.ts:17–26`; `src/lib/telegram-bot.ts:795–863`; `workers/compile.worker.ts:57–90`). Affiliate token webhooks are a distinct inline route and bot dispatcher (`src/app/api/telegram/affiliate/[token]/route.ts:21–60`; `src/lib/telegram-affiliate-bot.ts:205–245,296–368`). Full command inventory is in `TELEGRAM_FLOW.md`.

## Queues/workers

BullMQ queue names are `telegram-inbound`, `telegram-outbound`, `compile`, `relay`, and `notify`. Producers and workers share Redis configuration from `REDIS_URL` with localhost fallback; queue mode is disabled only when `DISABLE_QUEUES` matches supported true values (`src/lib/queues/index.ts:14–57`). Inbound Telegram, compile, and notify have proven producer and consumer paths. Outbound Telegram and relay have worker consumers but no in-repository producer call site found. Relay batch API execution is synchronous; the relay worker only logs/accepts jobs. Full graph: `QUEUE_GRAPH.md`.

## State/storage

Filesystem JSON persists platform/frontpage configuration; `.builds/` stores build files written by `saveScriptBuild()`; Redis stores affiliate projects/config/session/counters and BullMQ; browser state uses memory/localStorage/cookies; Kafka is used for events when configured with an in-memory fallback. `public/generated-scripts/*.min.js` is a separate checked-in/static-serving location. `saveScriptBuild()` writes `.builds`, returns a `/generated-scripts/...` URL and does not copy to `public/generated-scripts/` (`src/lib/script-build-store.ts:33–65,100–141`). Consequently the returned public URL does not itself establish that a same-named static file exists.

## Generated outputs

Proven output forms include JavaScript bundles/scripts, an HTML drainer wrapper, compiled frontpage browser IIFE, and script build records/metadata. Generator location, format, persistence and caller are enumerated in `GENERATED_OUTPUTS.md`. SDK-related source exists in repository; its outputs and connection are described only where generator/reference evidence exists.

## Connected paths

- Dashboard compile form → `/api/compile` → synchronous generator → response/build storage.
- Explicit queue compile request or Telegram queue-mode compile → `compile` queue → compile worker → generator → build.
- Platform Telegram webhook → optional inbound queue → command dispatcher; `/compile` can reach affiliate compile.
- Affiliate token webhook → inline affiliate command handler → affiliate compile.
- Frontpage config/action → `/api/frontpage/compile` → browser script → wallet execution helper.
- `/api/relay/batch` → synchronous viem transaction execution, with optional event/notification side effects.
- `/api/notify` → notify queue if enabled, otherwise direct notification send.

## Disconnected paths

No in-repository call site was found for `enqueueRelayJob()` or `enqueueTelegramOutbound()`. `relay.worker.ts` is not the implementation used by `/api/relay/batch`. ABI barrels, inline drainer ABI module, cleanup helper and selected generator wrappers lack proven callers. The imported custom ABI data is saved but not connected to registry generation. Details and evidence: `DISCONNECTED_IMPLEMENTATIONS.md`.

## Current limitations (observed behavior only)

- Queue-backed compile is opt-in per `/api/compile` request, while the observed dashboard call does not set `queue` or `async` (`src/app/api/compile/route.ts:78–95`; `src/components/compile/compile-output.tsx:203–250`).
- `saveScriptBuild()` writes `.builds`; the returned `/generated-scripts` URL has no matching copy operation in that store (`src/lib/script-build-store.ts:33–65,100–141`).
- Relay queue producer has no proven caller, and its consumer does not execute relay transactions; HTTP relay is synchronous (`src/lib/queues/relay.ts:22–34`; `workers/relay.worker.ts:12–23`; `src/app/api/relay/batch/route.ts:90–129,332–371`).
- Custom ABI records are persisted separately from static registry; custom registry entry is a placeholder with no ABI/address (`src/app/api/contracts/import/route.ts:35–50`; `src/lib/contract-registry.ts:72`).
- Similar ABI/artifact data exists in top-level `abi/`, `contracts json/`, inline declarations and dynamic artifact roots; they have separate readers (see `CONTRACT_ABI_FLOW.md`).
- Several root-level nested applications and package trees cannot be assigned to the root runtime without independent invocation/deployment evidence.

## Evidence index

The audit documents under `docs/audit/` supply line-specific endpoint, function, dependency, output, queue, configuration, storage and status evidence. Unknown relationships remain explicitly unproven rather than inferred.
