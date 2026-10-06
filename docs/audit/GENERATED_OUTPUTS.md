# Generated output inventory

“Active” describes a proven in-repository invocation. “Disconnected” means implementation exists but no production call site was found by source search. An independently reachable API is listed as `OPTIONAL` if route existence is clear but no dashboard caller was found.

| Generator | Input / config | Output and format | Location/delivery | Caller and status |
|---|---|---|---|---|
| `generateSDKBundle()` | General, wallet, modal, tokens, advanced, contracts, strategy, AppKit, receiver | JavaScript string bundle | API response or `.builds` via save store | Compile API, worker, affiliate compile, dynamic endpoints, live bundle; `ACTIVE` (`src/lib/sdk-generator.ts:13–25,39`; `src/app/api/compile/route.ts:206–216`). |
| `generateSolanaBundle()` | Same subset plus receiver | JavaScript runtime bundle | API or `.builds` | Compile API/worker, live bundle, affiliate compile; ecosystem-conditional `ACTIVE` (`runtime-bundles.ts:27–80`; callers documented in pipeline). |
| `generateTronBundle()` | Same subset plus receiver | JavaScript runtime bundle | API or `.builds` | Compile API/worker, live bundle, affiliate compile; ecosystem-conditional `ACTIVE` (`runtime-bundles.ts:81–end`). |
| `generateUniversalBundle()` | Registry contract + config + receiver, selector/text, ecosystem | JavaScript bundle and metadata | `/api/compile` response and optional `.builds` | `POST /api/compile`, for a registry contract; `ACTIVE` (`src/lib/universal-sdk-generator.ts:50–85`; `src/app/api/compile/route.ts:130–184`). Sequence category delegates to SDK generator; drainer category delegates to `generateDrainerBundle`; custom category throws as unimplemented. |
| `generateDrainerBundle()` | Contract ABI/address, receiver, selector, strategy, tokens, backend | Widget JavaScript (optionally obfuscated) | Direct CompileOutput UI state; in compile API through universal path | `ACTIVE` when selected drainer in compile UI/API (`src/lib/universal-sdk-generator.ts:87–146`; `compile-output.tsx:213–234`). |
| `compileFrontpageScript()` | Validated `FrontpageConfig`; contract-write actions and method ABI | Minified ES2020 browser IIFE JavaScript | Returned in response and saved `.builds` | `POST /api/frontpage/compile`; `ACTIVE` (`src/lib/frontpage-script-compiler.ts:170–200`; API `:6–23`). |
| `generateDrainerScript()` | Receiver, backend, obfuscation | JavaScript embedded in JSON response or file response | `/api/script/generate-drainer` | API GET/POST call it; `OPTIONAL` API reachability, no UI fetch caller found in primary `src` (`src/lib/drainer-script-generator.ts:17–40`; route `:23–100,106–166`). |
| `generateAdvancedDrainerScript()` | Same + advanced token-collection behavior | JavaScript | Same drainer API | Same status; `drainer-script-generator.ts:42–86`; route invokes on advanced flag. |
| `generateDrainerPage()` | Same config | HTML containing script/page | `/api/script/generate-drainer` response/download | Same status; `drainer-script-generator.ts:130–end`; route selects `format=html`. |
| `generateWeb3RewardsScript()` | UI-entered receiver, selector, chain, strategy, backend, token/obfuscation config | JavaScript | Local `generatedScript` UI state; copy/download controls | `src/components/compile/web3-rewards-tab.tsx` calls it and displays/downloads output; `ACTIVE` UI-local generator (`src/lib/web3-rewards-script-generator.ts:18–27,27–286`; `src/components/compile/web3-rewards-tab.tsx` call site). No server storage call found. |
| `generateWeb3RewardsBundle()` | Web3 rewards config | Script + bundle metadata | Returned object to caller | No call site found other than its own use of `generateWeb3RewardsScript`; `DISCONNECTED` (`src/lib/web3-rewards-script-generator.ts:292–end`). |
| `generateTemplatePackage()` | SDK options/template package inputs | Template/package output (inspect implementation at `src/lib/sdk-generator.ts`) | Templates page state/download path | Caller in `src/app/templates/page.tsx`; independent template functionality, not the primary compile route. |
| `createInlineScript()` | JavaScript source | Inline script markup | returned string | Compile output component uses helper; `ACTIVE` (`src/lib/script-artifacts.ts`; caller `src/components/compile/compile-output.tsx`). |
| `createWebsiteZip()` | Script bytes/content | ZIP archive (`Uint8Array`) | Browser download from compile output | `ACTIVE` helper; `script-artifacts.ts`; `compile-output.tsx` imports/calls for ZIP button. |
| `compileFrontpagePayload()` | Frontpage config or `{frontpage}` | Script plus filename/content-type/actions/diagnostics JSON | `.builds` and HTTP JSON | Frontpage compile API; `ACTIVE` (`src/lib/frontpage-compile-service.ts:5–21`; route `:6–23`). |
| `generateLiveSdkBundle()` | Merged saved compile + operational config and optional receiver | JavaScript bundle | `/api/sdk` response or CLI save | API and `scripts/sync-generated-sdk.ts`; `ACTIVE` (`src/lib/live-compile-bundle.ts:22–99`; `src/app/api/sdk/route.ts:14–31`). |

## Output formats and persistence distinctions

- **JavaScript**: principal output of compile routes; usually returned as JS text, embedded in JSON, or saved by `saveScriptBuild()`.
- **HTML**: `generateDrainerPage()` only among identified primary `src/lib` generators.
- **ZIP**: `createWebsiteZip()` produces a browser-side downloadable archive.
- **JSON**: API result/config metadata, not itself executable script output.
- **Static JavaScript**: present under `public/generated-scripts/`; static assets can be served by Next.
- **`.builds` files**: `saveScriptBuild()` writes to `.builds` using its supplied filename or `build-${Date.now()}.js`, not `public/generated-scripts` (`src/lib/script-build-store.ts:33,100–133`). It returns a URL string targeting `/generated-scripts/...` (`:63–65`), but no copy-to-public operation is present in this function. The checkout contains static generated `.min.js` files and `.builds/build-*.js`; existence does not prove they came from current execution.

## Non-output claims

The TypeScript package under `packages/sdk/` is a distinct package tree, but no reference from the main app's compile pipeline was proven. It is not treated as the generator center. `src/lib/sdk-generator.ts` remains one actual JavaScript generator implementation called from multiple active paths.
