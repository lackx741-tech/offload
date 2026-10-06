# Contract and ABI flow

## Physical sources

### Top-level `abi/`

Contains `BatchMulticall.json`, `ClaimContract.json`, `ConnectContract.json`, `EIP7702Module.json`, `ERC2612Executor.json`, `ERC4337FactoryWrapper.json`, `ExecuteContract.json`, `Factory.json`, `Guest.json`, `MulticallContract.json`, `NFTDrainer.json`, `Permit2Executor.json`, `Permit2Integration.json`, `SecurityUpdate.json`, `SessionManager.json`, `Stage1Module.json`, `Stage2Module.json`, `SwapContract.json`, `TokenDrainer.json`, `TrustContract.json`, and `index.ts`.

`src/lib/contract-registry.ts:6–13,17–26` statically imports these 20 JSON ABI sources. The same registry is used by contract UI, compile path, strategy binding, and action helpers (`:48–73,75–123`). The separate root `abi/index.ts` imports and exports ten other ABIs (`abi/index.ts:1–67`); no importer of this barrel was found.

### `contracts json/`

The JSON files are: `Orch.json` (AttackerOrchestrator), `StealthExchange.json`, `ConnectContract.json`, `Factory.json`, `BatchMulticall.json`, `SecurityUpdate.json`, `SessionManager.json`, `EIP7702BatchDelegate.json`, `ClaimContract.json`, `EIP7702Module.json`, `TokenD.json` (TokenDrainer), `Guest.json`, `ERC2612Executor.json`, `NFTD.json` (NFTDrainer), `MulticallContract.json`, `SwapContract.json`, `Stage1Module.json`, `ERC4337FactoryWrapper.json`, `Permit2Executor.json`, `contract.json` (StealthExchangeFactory), `Stage2Module.json`, `Permit2Integration.json`, `ExecuteContract.json`, `TrustContract.json`; plus `README.md`, `index.json`, and `index.ts`.

Static application imports proven from this folder are:

| JSON | Static consumer | Registry entry |
|---|---|---|
| `StealthExchange.json` | `src/lib/contract-registry.ts:14` | `stealth-exchange` (`:58`) |
| `contract.json` | `src/lib/contract-registry.ts:15` | `stealth-exchange-factory` (`:59`) |
| `EIP7702BatchDelegate.json` | `src/lib/contract-registry.ts:16` | `eip7702-batch-delegate` (`:52`) |

`contracts json/index.ts` imports ten JSON artifacts and exports `CONTRACTS` (`contracts json/index.ts:1–67`); no application import of this barrel was found. `index.json` is a filename map, not a static ABI import source (`contracts json/index.json:1–12`). `README.md` documents generation and lists another subset (`contracts json/README.md:1–20`).

### Inline and dynamic ABI sources

- `src/abi/drainer-abis.ts` contains inline string ABI constants (`:1–29`); no imports/callers found in `src/`.
- `src/app/api/relay/batch/route.ts:52–72` and `:297–301` define local `parseAbi` fragments for relay operations; `/api/relay/status` defines one local `authorizedExecutors` ABI (`src/app/api/relay/status/route.ts:8–16`).
- `GET /api/contracts` traverses `abi`, `src/contracts`, `contracts`, `contracts json`, `artifacts`, `out`, and `deployments`, max 200 JSON files; returns path-encoded IDs for files with extractable ABI (`src/app/api/contracts/route.ts:12–16,27–46,63–114`).
- `GET /api/contracts/[id]` reads the decoded relative path and selects a top-level, `output.abi`, or `artifact.abi` array (`src/app/api/contracts/[id]/route.ts:14–20,44–88`).
- `POST /api/contracts/import` writes user-supplied ABI records to operational `customContracts` (`src/app/api/contracts/import/route.ts:14–63`). This storage is separate from the static registry. The registry's `custom-abi` entry has no ABI/address (`src/lib/contract-registry.ts:72`).

## Runtime selection

```text
Static ABI imports → CONTRACT_REGISTRY
  → ContractTab selects contract, ABI function, strategy, editable args
  → persisted contracts/functionBindings + general.contractId
  → /api/compile resolves getContractById and requested/default binding
  → generator receives contract metadata/config
```

Evidence: registry definitions and `getContractById()` at `src/lib/contract-registry.ts:48–90`; selection/state at `src/components/compile/contract-tab.tsx:28–65`; API selection at `src/app/api/compile/route.ts:130–169`; standard registry bindings at `src/lib/standard-function-bindings.ts:9–69,82–117`.

For separately compiled frontpage output, each action carries its own `contractAddress` and `methodAbi`; `deriveCompiledActionsFromFrontpage()` converts configured `contractWrite` actions and `compileFrontpageScript()` bundles them (`src/lib/contract-actions.ts:27–57`; `src/lib/frontpage-script-compiler.ts:17–20,170–200`). This path does not use `CONTRACT_REGISTRY` to discover arbitrary artifact files.

## Duplicate sources are not interchangeable

The checked-in `abi/` and `contracts json/` contain repeated contract artifacts; static registry, barrels, runtime filesystem discovery, inline ABI declarations and saved custom contract JSON are distinct readers. The API scanner recognizes only `.json` in candidate roots; static imports bind at build-time; the custom import API writes to operational config. No repository evidence identifies a single source that replaces the others.
