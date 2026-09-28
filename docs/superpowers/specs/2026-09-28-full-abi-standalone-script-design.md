# ST3 Full-ABI Standalone `script.js` Compiler Design

**Date:** 2026-09-28  
**Status:** Revised consolidation design, pending user review
**Project:** `/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3`

## Objective

Complete ST3 as a private, no-code control plane that compiles dashboard configuration into one self-contained browser `script.js`. The dashboard must configure complete contract ABIs, function visibility, transaction payloads, execution strategies, workflow sequencing, generated UI, wallet presentation, themes, and automation policy without requiring an operator to edit code. The generated artifact must embed the selected ABI, strategy, payload, workflow, and UI runtime and operate independently from the private dashboard.

## Scope

### Included

- Complete JSON ABI ingestion for ABI entries whose `type` is `function`.
- Canonical signatures for overloaded functions, including tuples and array suffixes.
- Read actions for `view` and `pure` functions.
- Wallet-confirmed write actions for `nonpayable` and `payable` functions.
- Inputs for addresses, booleans, strings, bytes, signed and unsigned integers, fixed and dynamic arrays, tuples, and nested tuple arrays.
- Explicit native-value input for payable functions.
- Inline result and error display.
- A Shadow DOM interface that mounts itself when the document is ready.
- A single generated `script.js` with all required browser runtime code bundled.
- A dedicated frontend-compiler verification path plus a clean full-project production build.
- A private dashboard control plane for projects, contracts, functions, strategies, payloads, workflows, themes, preview, compilation, versioning, and artifact download.
- A transaction-payload engine as a first-class compiler component.
- Dashboard-configured automation for ABI analysis, UI generation, payload preparation, workflow sequencing, preview refresh, and artifact compilation.
- Strategy templates, dependency resolution, fallback configuration, and per-function strategy selection.
- Build versioning, integrity hashes, diagnostics, and reproducible project profiles.

### Excluded

- Private-key handling, server-side signing, relaying, or automatic transaction approval.
- SDK package generation.
- Telegram execution in the initial compiler milestone.
- Constructors, events, custom errors, receive, and fallback ABI entries as executable UI actions.

The compiler may preserve event and error entries as descriptive metadata later, but this implementation does not render them as callable functions.

## Current State

The existing compiler already:

- Produces `script.js` through esbuild.
- Bundles `prepareContractTransaction` and its Viem encoding dependency.
- Mounts an inline Shadow DOM interface.
- Handles one or more explicitly configured write actions.
- Preserves canonical tuple signatures.
- Keeps overloads distinct by using a one-item method ABI.

The main gap is integration. The dashboard, ABI tooling, strategy configuration, payload construction, modal configuration, and bundling implementations exist in separate paths and older projects, but they are not connected through one versioned configuration model and one deterministic compiler pipeline.

## Existing Implementations to Consolidate

The following local projects were inspected read-only and contain reusable concepts or modules:

| Source | Strongest reusable capability | Limitation to resolve during consolidation |
|---|---|---|
| ST3 | Current dashboard, registry, strategy bindings, transaction payload, Shadow DOM compiler, tests | Subsystems are partially disconnected; production type checking has a payload typing blocker |
| `GENERAL FRONTEND/dappweb-operator-panel` | Contract Studio, automatic read/write UI, modal/theme studio, embed UX | Code generation is mostly per-function and the strategy panel is currently a visual template |
| `multi-chain-web3-dashboard-compiler` | ABI/artifact parsing, selectors, classification, calldata encoding | Tuple canonicalization and deeply typed inputs require strengthening |
| `compile-campaign-dashboard-architecture` | Form-based transaction builders and downloadable JavaScript | Generated runtime depends on separate assumptions and its widget bundler contains scaffold behavior |
| `Perfect/V26/apps/compiler` | Module registry, dependency resolution, esbuild IIFE bundling, templates, versioning, integrity hashes | Several runtime modules are stubs and the output is SDK-oriented rather than the required standalone control-plane artifact |
| `ModalsFrontpage` | Modal and frontpage visual references | Reference material rather than a unified compiler implementation |

Consolidation means selectively porting verified behavior and tests into ST3. Files are not bulk-copied, moved, or deleted.

## Architecture

```text
Private ST3 dashboard control plane
  |-- project + contract + ABI configuration
  |-- function catalogue and visibility
  |-- strategy + fallback configuration
  |-- transaction-payload configuration
  |-- workflow + automation policy
  |-- modal, theme, prompt, and inline UI configuration
  |-- preview, validation, build, version, download
              |
              v
      Versioned project manifest
              |
              v
 Deterministic compiler pipeline
  ABI -> functions -> strategies -> payloads -> workflows -> UI modules
              |
              v
    Standalone browser `script.js`
  - embedded runtime manifest
  - ABI encode/decode and validation
  - payload and workflow engine
  - injected-wallet adapter
  - Shadow DOM interface
              |
              v
 Generated public execution interface
```

The private dashboard is not shipped to users of the generated project. Only the compiled runtime artifact and its explicitly selected configuration are shipped.

## Dashboard Control Plane

The existing ST3 dashboard is extended rather than replaced. It provides configuration-only workflows for:

- projects, versions, and saved profiles
- contract address, chain, raw ABI, artifact upload, and registry selection
- automatic ABI analysis and callable-function catalogue
- per-function inclusion, label, description, default arguments, native value, and ordering
- read, write, payable, overloaded, tuple, and array-function configuration
- strategy selection, required modules, fallback strategy, retry policy, and step ordering
- transaction-payload preview with destination, signature, arguments, calldata, and value
- workflow composition using ordered steps and explicit conditions
- theme, modal, wallet button, status, prompt, and result presentation
- automation mode, preview mode, diagnostics, compile, download, and version history

No operator must manually edit JSON or JavaScript. An advanced JSON view may exist for inspection and import/export, but it is not required for normal operation.

## Automation Policy

The global automation control changes compiler behavior, not wallet ownership:

- **Off:** configuration changes remain drafts until the control-plane user explicitly validates, previews, or compiles.
- **On:** ABI changes automatically re-analyze functions, refresh compatible strategy and payload schemas, regenerate the preview, and produce a new draft artifact after validation succeeds.

Per-workflow controls select automatic preparation and sequencing of eligible steps. Read-only calls can execute automatically when configured. Transaction steps can be prepared and advanced according to the selected workflow, while the connected wallet remains responsible for any confirmation required by its provider.

Automation state, compiler diagnostics, and the exact generated version are visible in the dashboard.

## Data Model

Introduce a versioned compiled function record that supports both reads and writes:

```ts
type CompiledAbiFunctionV2 = {
  schemaVersion: 2;
  kind: "contractRead" | "contractWrite";
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  chainId: number;
  contractAddress: string;
  methodAbi: AbiFunction;
  functionName: string;
  functionSignature: string;
  stateMutability: "pure" | "view" | "nonpayable" | "payable";
  inputs: AbiParameter[];
  outputs: AbiParameter[];
  defaultArgs: unknown[];
  valueWei?: string;
};
```

Action identity is based on the canonical signature rather than the function name. A deterministic ID will combine a normalized function name with a short signature-derived suffix, preventing collisions between overloads.

The project manifest additionally contains:

```ts
type CompiledProjectManifestV2 = {
  schemaVersion: 2;
  project: ProjectPresentation;
  chain: ChainConfiguration;
  contract: ContractConfiguration;
  functions: CompiledAbiFunctionV2[];
  strategies: CompiledStrategy[];
  payloads: CompiledTransactionPayload[];
  workflows: CompiledWorkflow[];
  automation: AutomationPolicy;
  interface: GeneratedInterfaceConfiguration;
  build: BuildMetadata;
};
```

Every reference between functions, strategies, payloads, and workflow steps uses deterministic IDs and is validated before bundling.

## Transaction-Payload Engine

`src/lib/transaction-payload.ts` is retained as a core subsystem and repaired rather than bypassed. Its responsibilities are narrowed and made explicit:

1. Accept a validated compiled function, configured arguments, strategy, chain, contract destination, and optional native value.
2. Normalize the input values according to the selected function ABI.
3. Encode deterministic calldata from the exact one-item function ABI so overloads remain distinct.
4. Produce a serializable payload containing chain ID, destination, calldata, value, function signature, display description, and workflow metadata.
5. Produce typed-data payloads only when the selected strategy requires them.
6. Return structured diagnostics rather than silently substituting unrelated functions or values.

The current independent `as never` casts are removed through a typed ABI boundary. The payload engine does not select a hidden function or invent missing arguments; all compiled values originate from dashboard configuration or explicit runtime input.

Payload previews in the dashboard use the same engine as generated runtime execution. There is no separate preview-only encoder.

## Strategy and Workflow Engine

Strategies are dashboard-selectable modules with declared compatibility, required inputs, dependencies, generated payload steps, and fallback behavior. The compiler resolves dependencies before bundling, following the useful module-registry pattern found in `Perfect/V26`.

A workflow is an ordered graph of steps:

- read contract state
- prepare a payload
- request a wallet operation
- wait for or inspect a result
- branch on a declared result
- advance to the next configured step
- apply a configured fallback or stop with a visible error

The first implementation uses a validated ordered sequence with explicit conditional transitions. Arbitrary executable JavaScript is not accepted as dashboard configuration.

## ABI Validation

The compiler must reject malformed callable entries with actionable diagnostics. A callable entry requires:

- `type === "function"`
- a non-empty string `name`
- a supported `stateMutability`
- array-valued `inputs` and `outputs` when present
- valid parameter types
- tuple components when a tuple type requires them

Unsupported or non-callable ABI entries are not fatal unless the ABI contains no valid functions. Diagnostics distinguish skipped metadata from invalid functions.

Contract addresses and chain IDs are validated before bundling. The compiler must not silently substitute a contract address.

## Canonical Signatures and Overloads

Canonical parameter types recursively expand tuples:

```text
tuple                         -> (address,uint256)
tuple[]                       -> (address,uint256)[]
tuple[2][]                    -> (address,uint256)[2][]
execute(address)              -> distinct action
execute(bytes)                -> distinct action
```

The complete one-item ABI entry is passed to the encoder or decoder. This ensures an overloaded name resolves deterministically.

## Argument Controls and Normalization

The inline UI derives controls from ABI input metadata:

- `bool`: checkbox or true/false control.
- `address`, `string`, `bytes*`: text input with type-specific validation.
- `uint*`, `int*`: decimal text converted to native `bigint`.
- arrays: JSON array input, recursively normalized.
- tuples: structured JSON object or positional JSON array, recursively normalized.
- nested tuple arrays: JSON editor with a generated shape hint.

The UI shows the canonical parameter type and never guesses hidden argument values. Default arguments come only from explicitly configured defaults.

## Read Execution

For `view` and `pure` functions:

1. Normalize input values.
2. Encode calldata from the one-item function ABI.
3. Call the configured contract through `eth_call` using the injected provider.
4. Decode the returned data with the function outputs.
5. Render JSON-safe values; bigint values become decimal strings.
6. Emit `read:requested`, `read:completed`, or `read:error` events.

Reads do not request a transaction signature. A connected account is optional unless the caller explicitly needs an account-dependent `from` value.

## Write Execution

For `nonpayable` and `payable` functions:

1. Request the wallet account when needed.
2. Verify or request the configured chain.
3. Normalize input values.
4. Encode calldata from the one-item function ABI.
5. Construct a visible JSON-RPC transaction targeting the configured contract.
6. Include an explicit hexadecimal `value` only for payable functions when the operator supplied a value.
7. Request `eth_sendTransaction` from the injected wallet.
8. Display and emit the returned transaction hash.

The browser wallet remains the final confirmation boundary.

## Generated Inline UI

The generated script mounts into the configured selector or creates `[data-contractkit-root]`. It renders:

- Project heading and explanatory copy.
- Wallet connection and current-account state.
- Function filters: All, Read, Write, Payable.
- One card per compiled ABI function.
- Canonical function signature and mutability badge.
- Typed argument controls with tuple/array examples.
- An explicit value field for payable functions.
- Read result or submitted transaction hash.
- Global accessible status and error output.

The styling remains fully inline inside Shadow DOM so host-page styles cannot break the generated dashboard.

## Programmatic Browser API

The bundle exposes:

```ts
window.ContractKitFrontend = {
  config,
  actions,
  mount(),
  root(),
  connect(),
  runAction(id, values?, options?),
  on(eventName, handler),
};
```

`runAction` uses the same normalization and execution path as the rendered UI. It does not create a second implementation.

## Compiler Interface

The dedicated compiler accepts a frontend compile payload containing:

- project hero metadata
- chain ID
- contract address
- complete ABI
- optional per-signature labels, descriptions, defaults, visibility, and payable value defaults
- optional mount selector
- selected strategies and fallback policies
- payload configuration and workflow steps
- automation policy
- modal, theme, prompt, and result-display configuration

It returns:

- `filename: "script.js"`
- content type
- relative script tag
- generated JavaScript
- compiled function summary
- validation diagnostics
- artifact size
- version and integrity hash
- resolved module list

The existing manually selected action format remains supported during migration. A full-ABI payload is compiled through the new V2 manifest path.

## Error Handling

Compiler errors include the ABI index and function signature when available. Runtime errors are normalized for:

- missing injected provider
- account-request rejection
- chain-switch rejection
- invalid input values
- malformed tuple or array JSON
- encoding failure
- `eth_call` failure or revert
- output decoding failure
- transaction rejection

No runtime exception is swallowed. The UI and event API receive the same error message.

## Testing Strategy

### Unit tests

- ABI filtering and validation.
- Canonical signatures, fixed arrays, tuples, and nested tuple arrays.
- Stable IDs for overloaded functions.
- Integer, boolean, array, tuple, and nested-tuple normalization.
- Read calldata encoding and output decoding.
- Write transaction construction and payable values.

### Compiler tests

- A mixed read/write ABI produces all expected actions.
- The script contains its embedded manifest and no absolute project domain.
- The script parses as JavaScript.
- The artifact uses one relative `<script>` tag.
- No SDK-generator module is imported.

### Browser smoke tests

- Automatic mounting.
- Read and write cards render.
- Tuple and array hints render.
- Fallback mount root works.
- Browser API resolves overloaded action IDs.
- Mock injected provider receives the expected `eth_call` and `eth_sendTransaction` requests.

### Project verification

- Focused tests pass.
- Complete existing test suite passes.
- `git diff --check` passes.
- Dedicated frontend artifact compilation succeeds.
- The repaired transaction-payload engine passes its focused tests and the full-project TypeScript build.

## Build, Versioning, and Artifacts

The compiler adopts the strongest verified concepts from the existing implementations:

- esbuild browser IIFE output
- deterministic manifest injection
- module dependency resolution
- versioned artifact output
- SHA-256 integrity metadata
- standalone inline styles and UI runtime
- one relative script tag

The output remains `script.js` for the active build. Versioned copies and build metadata are retained by the dashboard so a prior verified artifact can be identified and restored without overwriting source configuration.

## Migration and Preservation

- No existing ABI artifact is deleted or rewritten.
- Existing manually configured frontpage actions continue to compile.
- Existing generated-script API events remain available.
- The legacy SDK generator is not used by the new path.
- `src/lib/transaction-payload.ts` is repaired under focused tests and connected to the versioned compiler manifest.
- Existing projects elsewhere on the computer are treated as read-only references unless an implementation plan names a specific module to port.
- No reference project is moved, overwritten, or deleted.
- The compiler produces a new artifact; it does not mutate the source ABI.

## Acceptance Criteria

1. A valid mixed ABI compiles into one self-contained `script.js`.
2. Every valid ABI function appears exactly once, including overloads.
3. Reads return decoded values inline.
4. Writes require visible browser-wallet confirmation.
5. Arrays, tuples, fixed arrays, and nested tuple arrays normalize correctly.
6. The bundle works with only `<script src="./script.js" defer></script>`.
7. There is no runtime backend or SDK-generator dependency.
8. Existing frontpage compiler behavior remains compatible.
9. Focused tests, the complete suite, and browser smoke tests pass.
10. Dashboard users can configure the ABI, strategies, payloads, workflows, automation, and UI without editing source code.
11. The transaction-payload engine uses the same validated compiled ABI functions as the standalone runtime.
12. Builds have version and integrity metadata and can be reproduced from their saved project manifest.
