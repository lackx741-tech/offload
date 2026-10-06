# Internal dependency graph

Edges below represent static imports or directly referenced call relationships visible in repository source; configuration/data flow is separated from imports. Graph is intentionally limited to the central runtime slice rather than inferring dependencies from similarly named files.

## Core import and call edges

| Importer / caller | Imported module or called symbol | Evidence |
|---|---|---|
| `src/app/layout.tsx` | `ThemeProvider`, `Toaster`, `TooltipProvider`, `StoreHydration`, `ReownProvider`, `LayoutWrapper` | `src/app/layout.tsx:5–10,46–59` |
| `src/app/compile/page.tsx` | Compile tab components; `useStore`; `deriveCompileConfigFromFrontpage` | `src/app/compile/page.tsx:4–20` |
| `src/components/compile/compile-output.tsx` | `useStore`, `getContractById`, `generateDrainerBundle`, `createInlineScript`, `createWebsiteZip` | `src/components/compile/compile-output.tsx:1–18`; calls at `:203–250` and action handlers below |
| `src/components/compile/compile-output.tsx` | HTTP `POST /api/compile` | `src/components/compile/compile-output.tsx:237–250` |
| `src/app/api/compile/route.ts` | auth, queue producer, config stores, SDK/runtime/universal generators, registry/bindings, build store | `src/app/api/compile/route.ts:1–25`; calls `:78–95,100–108,130–184,185–225` |
| `src/lib/universal-sdk-generator.ts` | `generateSDKBundle`, `obfuscateScript`, `transaction-payload` constants, registry backend lookup, `drainer-widget-runtime.js` | `src/lib/universal-sdk-generator.ts:11–28,50–84,87–146` |
| `src/lib/affiliate-compile.ts` | project store, config defaults, SDK/non-EVM generators, obfuscator, build store | `src/lib/affiliate-compile.ts:1–20,32–112` |
| `src/lib/live-compile-bundle.ts` | compile/operational stores, defaults, SDK/non-EVM generators, standard bindings | `src/lib/live-compile-bundle.ts:1–16,22–99` |
| `src/lib/frontpage-compile-service.ts` | frontpage compiler, action compatibility analyzer, frontpage config validator | `src/lib/frontpage-compile-service.ts:1–20` |
| `src/lib/frontpage-script-compiler.ts` | esbuild, compiled frontpage actions, `prepareContractTransaction` in generated browser entry | `src/lib/frontpage-script-compiler.ts:1–3,17–20,170–200` |
| `src/lib/contract-actions.ts` | ABI compiler type/canonical parameter helpers; frontpage action/config types | `src/lib/contract-actions.ts:1–2,27–57` |
| `src/lib/execute-contract-action.ts` | viem encoding and ABI value codec | `src/lib/execute-contract-action.ts:1–4,6–35` |
| `src/lib/contract-registry.ts` | JSON ABI imports; registry helper consumers in contract UI/API/generators | `src/lib/contract-registry.ts:6–26,48–123`; primary consumers in `src/app/api/compile/route.ts:24–25,130–169` and `src/components/compile/contract-tab.tsx:1–4` |
| `src/app/api/contracts/route.ts` | filesystem walk over artifact roots | `src/app/api/contracts/route.ts:27–46,63–114` |
| `src/app/api/contracts/[id]/route.ts` | filesystem JSON read; registry name/address lookup | `src/app/api/contracts/[id]/route.ts:14–41,44–88` |
| Telegram webhook route | webhook auth, inbound queue producer, inline `processTelegramUpdate` fallback | `src/app/api/telegram/webhook/route.ts:1–9,21–45` |
| `workers/telegram.worker.ts` | `processTelegramUpdate`, direct Telegram API sender, queue names/Redis options | `workers/telegram.worker.ts:8–15,17–42` |
| `src/lib/telegram-bot.ts` | projects, session store, builds, Telegram, Redis, compile queue | `src/lib/telegram-bot.ts:35–55` |
| `workers/compile.worker.ts` | affiliate compile, config stores, generators, build store, direct Telegram sender | `workers/compile.worker.ts:7–17,23–48,57–90` |
| `src/app/api/notify/route.ts` | Redis rate limiter, notify producer, inline Telegram service | `src/app/api/notify/route.ts:1–5,15–58` |
| `workers/notify.worker.ts` | notification delivery service and notify job type | `workers/notify.worker.ts:4–27` |
| `src/app/api/relay/batch/route.ts` | config/registry, viem, Redis limiter, Telegram, Kafka | `src/app/api/relay/batch/route.ts:1–18,90–129,342–380` |

## Route and service fan-in

`compileAffiliateProject` is called by `workers/compile.worker.ts`, `/api/affiliate/compile`, `/api/projects/[id]/compile`, and Telegram bot inline compile paths. `generateSDKBundle` has multiple independent consumers: compile API fallback, universal generator sequence branch, worker and affiliate paths, live `/api/sdk`, dynamic `/api/script`, template page. Search evidence: repository symbol references in `GENERATED_OUTPUTS.md`.

`src/lib/queues/relay.ts` and `src/lib/queues/telegram.ts` export enqueue functions but no in-repository producers were found for those specific functions. Definitions/import edges do not imply runtime reachability; see `QUEUE_GRAPH.md`.

## Other source trees

The repository contains independent packages and nested apps (`packages/sdk`, `project`, `Affliate and admin`, `standalone`, `web3-platform`, etc.). No static imports from the root Next `src/` entry graph into these roots were identified. They are represented as separate/unknown rather than connected to the primary runtime.
