# Script generation pipeline

## Primary dashboard compile

```text
Compile page and panels
  → Zustand config fields
  → CompileOutput.handleCompile()
     → drainer category: generateDrainerBundle() locally
     → otherwise POST /api/compile with config payload
  → POST() chooses queue only if DISABLE_QUEUES is false and queue/async is true
     → queued response + status URL
     OR merge config, validate addresses, resolve registry contract/binding
  → generateUniversalBundle() if selected ID is in registry
     → category sequence: generateSDKBundle()
     → category drainer: generated widget runtime + obfuscation
     → category custom: throws
     OR fallback runtime-bundles / SDK generator
  → optional saveScriptBuild()
  → response includes bundle and publishedBuild metadata
```

Evidence and transition inputs/outputs:

| Transition | Source / function | Input → output | Next consumer |
|---|---|---|---|
| UI → state | `src/app/compile/page.tsx:23–77`; `src/lib/store.ts:37–76,79–127` | `/api/compile-config` config hydrates general/wallet/modal/tokens/advanced/payout/contracts/strategy state. Tabs update partial store slices. | `CompileOutput` reads those slices. |
| State → request/local generation | `src/components/compile/compile-output.tsx:149–179,203–250` | On compile button: selected contract and store state. Drainer category invokes generator directly; otherwise serializes the config into POST `/api/compile`. | Browser gets generated string/result. |
| API → config + contract | `src/app/api/compile/route.ts:64–169` | Request body, defaults, operational config; optional persistence; selected `contractId` defaults to `stage1-module`; registry metadata and `buildBindingForContract`. | Universal generator or ecosystem fallback. |
| Contract → strategy binding | `src/lib/contract-registry.ts:48–90`; `src/lib/standard-function-bindings.ts:9–69,82–117`; `src/lib/strategy-preset-bindings.ts:78–109` | Registry ID, ABI, address and strategy selection → binding/function args and merged config. | SDK bundle config or action route. |
| API → generator | `src/app/api/compile/route.ts:171–217` | Registry-selected `ContractMeta`, resolved receiver and config → JS. Non-registry fallback uses Solana/Tron/SDK function selected by ecosystem. | HTTP response and optional store. |
| Generator → saved artifact | `src/app/api/compile/route.ts:219–251`; `src/lib/script-build-store.ts:100–141` | Script string, framework/source → default timestamped `.js` file under `.builds`; returns `ScriptBuildRecord`. | API response/UI; Telegram worker may create completion URL. |

The compile API queue branch is an opt-in, not the default: `payload.queue === true || payload.async === true` gates it (`src/app/api/compile/route.ts:78–95`). The compile UI path sends no queue flag in the request body shown at `src/components/compile/compile-output.tsx:237–250`, so that caller takes the synchronous branch unless request construction changes beyond the cited range.

## Other independent generation paths

### Affiliate projects

`compileAffiliateProject()` reads project record/config from Redis; defaults missing UI configuration; takes payout receiver/domain values from the project; chooses Solana, Tron or SDK bundle; applies obfuscation/domain lock; updates `lastCompiled`; optionally stores a build (`src/lib/affiliate-compile.ts:32–112`). Callers include compile worker (`workers/compile.worker.ts:62–76`), affiliate API (`src/app/api/affiliate/compile/route.ts:31–106`), project compile API (`src/app/api/projects/[id]/compile/route.ts:27–63`), and Telegram bot handlers (`src/lib/telegram-bot.ts:795–863`, inline fallback).

### Live platform script

`generateLiveSdkBundle()` merges compile JSON and operational JSON, merges configured bindings over `getStandardExecutionBindings()`, resolves receiver, and selects ecosystem bundle (`src/lib/live-compile-bundle.ts:22–99`). `GET /api/sdk` returns the generated bundle with optional obfuscation (`src/app/api/sdk/route.ts:14–31`). `scripts/sync-generated-sdk.ts:9–17` instead stores it using `saveScriptBuild()`.

### Frontpage standalone script

`POST /api/frontpage/compile` calls `compileFrontpagePayload()`, saves the returned script with filename `script.js`, and returns script and metadata (`src/app/api/frontpage/compile/route.ts:6–23`). `compileFrontpagePayload()` unwraps optional `frontpage`, validates with `isFrontpageConfig`, then invokes `compileFrontpageScript` and action diagnostics (`src/lib/frontpage-compile-service.ts:5–21`). The compiler selects `contractWrite` actions and bundles `prepareContractTransaction` into a minified browser IIFE (`src/lib/frontpage-script-compiler.ts:17–20,170–200`).

### Drainer route

`POST`/`GET /api/script/generate-drainer` chooses JS or HTML and basic/advanced generator based on input (`src/app/api/script/generate-drainer/route.ts:23–100,106–166`). It returns a JSON-wrapped script for POST or a download response for GET. No primary `src` dashboard caller was found. This route is distinct from registry-powered `generateDrainerBundle()`.

### Local Web3 rewards UI

`Web3RewardsTab` calls `generateWeb3RewardsScript(config)` and displays the output; generator optionally obfuscates before returning text (`src/components/compile/web3-rewards-tab.tsx`; `src/lib/web3-rewards-script-generator.ts:27–286`). The separate `generateWeb3RewardsBundle()` wrapper is exported but no caller was found (`:292–end`).

## Generated script runtime consumer

The browser frontpage bundle mounts a custom UI, requests wallet accounts, switches chain, normalizes ABI args and sends `eth_sendTransaction` (`src/lib/frontpage-script-compiler.ts:41–80,91–166`). Other bundles embed their runtime and endpoint configuration; their actual browser-side execution/HTTP consumers are source strings in `sdk-generator.ts`, `runtime-bundles.ts`, `drainer-widget-runtime.js`, and `web3-rewards-script-generator.ts`. Output persistence and delivery are itemized in `GENERATED_OUTPUTS.md`.
