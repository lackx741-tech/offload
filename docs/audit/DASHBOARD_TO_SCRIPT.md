# Dashboard-to-script trace

## Compile page load and state

`src/app/compile/page.tsx:23–77` loads `/api/compile-config` and writes each persisted config category to Zustand. `src/lib/store.ts:37–76,79–127` identifies slices and setters. The frontpage sync button separately loads `/api/config`, derives only general/tokens/advanced config, then sets those slices (`compile/page.tsx:79–100`; `src/lib/frontpage-compile-sync.ts:21–100`).

`GeneralTab`, `WalletTab`, `ModalTab`, `TokensTab`, `AdvancedTab`, and `PayoutTab` mutate corresponding store slices. `ContractTab` selects registry function/strategy and writes function bindings; see `src/components/compile/contract-tab.tsx:28–65`. The configuration does not persist at each edit; compile request and config endpoints persist it.

## Fields with proven pipeline consumers

| UI/state | Config downstream | Validation/API/store | Generator/output effect |
|---|---|---|---|
| General: ecosystem, receiver-adjacent UI fields, selector/text, site and transaction selection | `generalConfig` | API compile validates supplied contract address and resolved receiver (`src/app/api/compile/route.ts:71–76,124–140`). | Ecosystem chooses Solana/Tron/EVM bundle; contract ID/function selection affects registry and binding; selector/text flow into universal generator (`:130–183`). |
| Wallet | `walletConfig` | Included in compile body (`src/components/compile/compile-output.tsx:237–250`); persisted in compile config when API `saveConfig` is true (`route.ts:100–108`). | Passed to universal/SDK/non-EVM generation (`route.ts:173–216`; `sdk-generator.ts:13–25`). |
| Modal | `modalConfig` | Included in POST and persisted as above. | Framework/presentation/external SDK flags are passed into selected generator; framework also labels stored build (`route.ts:173–225`; `workers/compile.worker.ts:44–47`). |
| Tokens | `tokensConfig` | Included in POST; compile store validation (`compile-config-store.ts:59–89`). | Passed into runtime bundle, SDK, universal widget and rewards generator (`route.ts:173–216`; `universal-sdk-generator.ts:114–130`). |
| Advanced | `advancedConfig` | Included in POST. | Passed to generators; `twoStepWithdrawal` is supplied to universal generation as `twoStep` (`route.ts:173–183`). Exact per-option runtime effects depend on generated code. |
| Payout | `payoutConfig` | Included in POST; merged with operational config; written to compile and operational store (`route.ts:31–48,100–108`). | Receiver resolves from request, operational payout, merged payout, then zero-address fallback (`route.ts:124–128`); passed to generator. |
| Contract selection and function args | `contractsConfig`, `generalConfig.contractId`, transaction function/binding | ContractTab mutation (`contract-tab.tsx:45–65`); compile API `getContractById`, `buildBindingForContract` (`route.ts:130–169`). | ABI/address/functions are included in SDK/universal config; `contractWrite` binding guides generated calldata path. |
| Strategy selection | `strategyConfig` | CompileOutput validates compatibility against selected registry contract and sends selected strategy (`compile-output.tsx:171–174,237–250`). | Strategy and execution backend are passed to generator (`api/compile/route.ts:171–216`); selected contract binding can force direct defaults (`:149–168`). |

## Separate UI generation

`Web3RewardsTab` owns additional local fields (receiver, button selector, strategy, chains, obfuscation and backend) and calls `generateWeb3RewardsScript` directly. Output is component state, with UI actions to copy/download; it does not follow the `/api/compile` persistence path (`src/components/compile/web3-rewards-tab.tsx`; `src/lib/web3-rewards-script-generator.ts:18–27,27–286`).

`CompileOutput` also invokes `generateDrainerBundle()` directly when selected contract category is `drainer`, providing local state and literal empty contract/strategy/AppKit subsets; that branch does not call `/api/compile` or `saveScriptBuild` (`src/components/compile/compile-output.tsx:203–234`).

## UI present — output connection not found

Do not treat fields as disconnected simply because their backend is not obvious. A field-to-specific-runtime effect could not be established for every field from control state alone. In particular, the tab setter proves state mutation but not whether every field has a consumer in the generator's embedded template. Marking individual field effects `UNKNOWN` is more accurate than inferring behavior from label text. The entire independent `generateWeb3RewardsBundle()` wrapper has no discovered caller (see `DISCONNECTED_IMPLEMENTATIONS.md`).

The CompileOutput request path only establishes the displayed body portion at `src/components/compile/compile-output.tsx:237–250`; the API's own queue condition requires `queue` or `async` (`src/app/api/compile/route.ts:78–95`). No queue flag is present in that cited UI body.

## Frontpage builder path

Frontpage is a second, distinct output compiler. Its runtime page gets `/api/config` and may restore localStorage config (`src/app/frontpage/runtime/page.tsx`). The config API persists `FrontpageConfig` (`src/app/api/config/route.ts:54–80`). On compile, actions of kind `contractWrite` are converted to compiled action objects (`src/lib/contract-actions.ts:27–57`), then esbuild produces a browser IIFE and `/api/frontpage/compile` stores/returns it (`src/lib/frontpage-script-compiler.ts:170–200`; `src/app/api/frontpage/compile/route.ts:6–23`).
