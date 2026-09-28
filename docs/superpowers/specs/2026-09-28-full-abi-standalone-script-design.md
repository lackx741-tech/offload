# ST3 Full-ABI Standalone `script.js` Compiler Design

**Date:** 2026-09-28  
**Status:** Approved design, pending implementation plan  
**Project:** `/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3`

## Objective

Extend ST3's existing standalone frontend compiler so a complete EVM contract ABI can be compiled into one self-contained browser `script.js`. The generated artifact must embed its ABI-derived action manifest, render its own inline UI, connect to an injected browser wallet, execute reads and wallet-confirmed writes, decode results, and expose a small programmatic API. It must not depend on the SDK generator or a backend at runtime.

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
- A dedicated frontend-compiler verification path independent of unrelated legacy backend TypeScript failures.

### Excluded

- Changes to `src/lib/transaction-payload.ts`.
- Changes to its current Viem typing failure.
- Private-key handling, server-side signing, relaying, or automatic transaction approval.
- SDK package generation.
- Telegram execution or backend execution.
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

The main gap is that the frontpage configuration creates only manually selected write actions. Read functions, output metadata, the complete ABI, and ABI-wide UI generation are not represented in the compiled action schema.

## Architecture

```text
Uploaded JSON artifact / raw ABI
              |
              v
       ABI validation layer
              |
              v
 Canonical function manifest compiler
   |          |             |
 read       write         payable
   |          |             |
   +----------+-------------+
              |
              v
    Standalone browser bundle
   - embedded action manifest
   - ABI value normalization
   - encode/decode utilities
   - injected-wallet adapter
   - Shadow DOM UI
              |
              v
         `script.js`
```

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

It returns:

- `filename: "script.js"`
- content type
- relative script tag
- generated JavaScript
- compiled function summary
- validation diagnostics
- artifact size

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
- The known untouched `transaction-payload.ts` failure is reported separately and is not represented as a frontend compiler failure.

## Migration and Preservation

- No existing ABI artifact is deleted or rewritten.
- Existing manually configured frontpage actions continue to compile.
- Existing generated-script API events remain available.
- The legacy SDK generator is not used by the new path.
- `src/lib/transaction-payload.ts` remains unchanged.
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
10. The legacy `transaction-payload.ts` file is not modified.
