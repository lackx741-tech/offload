# ST3 Control Plane Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete ST3 as a private no-code control plane that compiles complete ABI, strategy, transaction-payload, workflow, automation, and interface configuration into one standalone `script.js`.

**Architecture:** A versioned project manifest is the single source of truth. Focused compiler modules validate and transform that manifest into deterministic ABI functions, transaction payloads, strategy workflows, and an inline Shadow DOM runtime; the existing ST3 dashboard edits the manifest and previews the same runtime that is bundled for production.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Vitest, Viem 2, esbuild, injected EIP-1193 providers, existing ST3 UI components.

**Spec:** `docs/superpowers/specs/2026-09-28-full-abi-standalone-script-design.md`

## Global Constraints

- Extend the existing ST3 dashboard; do not create a competing dashboard.
- Preserve all existing projects and ABI artifacts; do not move or delete reference material.
- The normal dashboard workflow must not require editing JSON or JavaScript.
- Generate one self-contained browser `script.js` with inline Shadow DOM UI.
- Do not import or call the legacy SDK generator from the standalone compile path.
- Use exact one-function ABI entries for encoding and decoding overloaded functions.
- Support `view`, `pure`, `nonpayable`, and `payable` functions.
- Support addresses, booleans, strings, bytes, integers, fixed/dynamic arrays, tuples, and nested tuple arrays.
- Keep browser-wallet confirmation as the signing boundary; do not add private-key handling or silent signing.
- Reuse verified concepts from local reference projects, but port behavior deliberately rather than bulk-copying files.
- Each task uses test-first development and ends with a focused commit.

## Review Focus

- Malformed tuple ABI entries must produce an indexed diagnostic instead of crashing or silently compiling.
- Overloaded functions with the same name must retain distinct IDs, ABI entries, controls, and calldata selectors.
- Very large integers must remain exact decimal strings or `bigint`; they must never pass through JavaScript `number`.
- A stale workflow reference to a removed function, strategy, or payload must block compilation with an actionable path.
- Repeated automatic rebuild requests must be serialized or superseded so an older build cannot overwrite a newer project version.

---

## File Structure

### Core manifest and ABI compiler

- Create `src/lib/control-plane/project-manifest.ts` — versioned source-of-truth types and validation.
- Create `src/lib/control-plane/abi-compiler.ts` — complete ABI validation, canonical signatures, deterministic IDs, and diagnostics.
- Create `src/lib/control-plane/value-codec.ts` — recursive ABI input normalization and JSON-safe result formatting.
- Test in `test/control-plane-project-manifest.test.ts`, `test/control-plane-abi-compiler.test.ts`, and `test/control-plane-value-codec.test.ts`.

### Payload, strategy, and workflow engine

- Modify `src/lib/transaction-payload.ts` — typed ABI boundary and deterministic generic payload creation.
- Create `src/lib/control-plane/payload-compiler.ts` — binds compiled functions and configured values to payload definitions.
- Create `src/lib/control-plane/strategy-registry.ts` — declarative strategy modules and dependency resolution.
- Create `src/lib/control-plane/workflow-compiler.ts` — ordered steps, conditions, fallback references, and validation.
- Test in `test/transaction-payload.test.ts`, `test/control-plane-payload-compiler.test.ts`, `test/control-plane-strategy-registry.test.ts`, and `test/control-plane-workflow-compiler.test.ts`.

### Standalone runtime and compiler

- Create `src/lib/control-plane/runtime-contract.ts` — shared browser-runtime request/result/event types.
- Create `src/lib/control-plane/runtime-execution.ts` — read calls, wallet-confirmed writes, output decoding, and workflow step execution.
- Modify `src/lib/frontpage-script-compiler.ts` — bundle the V2 manifest and full runtime.
- Modify `src/lib/frontpage-compile-service.ts` — accept V1 actions or a V2 control-plane manifest.
- Modify `src/app/api/frontpage/compile/route.ts` — return version, integrity, modules, diagnostics, and script.
- Test in `test/control-plane-runtime-execution.test.ts`, `test/frontpage-script-compiler.test.ts`, and `test/frontpage-compile-route.test.ts`.

### Dashboard control plane

- Create `src/components/control-plane/ProjectSettings.tsx`.
- Create `src/components/control-plane/AbiStudio.tsx`.
- Create `src/components/control-plane/FunctionCatalogue.tsx`.
- Create `src/components/control-plane/PayloadInspector.tsx`.
- Create `src/components/control-plane/StrategyWorkflowBuilder.tsx`.
- Create `src/components/control-plane/InterfaceStudio.tsx`.
- Create `src/components/control-plane/AutomationBuildPanel.tsx`.
- Create `src/lib/control-plane/project-store.ts` — local project profiles and version migration.
- Create `src/lib/control-plane/automation-controller.ts` — debounced validation/preview/build state machine.
- Modify `src/app/frontpage/page.tsx` — compose the focused control-plane components.
- Test pure models in `test/control-plane-project-store.test.ts` and `test/control-plane-automation-controller.test.ts`; browser-test the composed dashboard.

### Build artifacts and verification

- Create `src/lib/control-plane/artifact-version.ts` — content-derived version metadata and SHA-256 integrity.
- Modify `src/lib/script-build-store.ts` — store manifest identity, version, integrity, resolved modules, and build status.
- Create `scripts/compile-control-plane.mjs` — dedicated reproducible frontend artifact command.
- Modify `package.json` — add `build:control-plane` and focused verification scripts.
- Create `test/control-plane-e2e.test.ts` and browser smoke fixture `test/fixtures/control-plane-smoke.html`.

---

### Task 1: Establish the Versioned Project Manifest

**Files:**
- Create: `src/lib/control-plane/project-manifest.ts`
- Create: `test/control-plane-project-manifest.test.ts`
- Reference: `src/lib/frontpage-config.ts`
- Reference: `src/lib/types.ts`

**Interfaces:**
- Produces: `ControlPlaneProjectV2`, `ControlPlaneValidationResult`, `validateControlPlaneProject(value: unknown)`, and `migrateFrontpageConfigToControlPlane(config: FrontpageConfig)`.
- Consumes: existing `FrontpageConfig`, chain IDs, contract address, hero configuration, and action configuration.

- [ ] **Step 1: Write failing validation and migration tests**

Cover a complete valid V2 project, missing contract address, duplicate function IDs, invalid workflow references, and migration from one existing V1 frontpage action. Assert diagnostic paths such as `contract.address` and `workflows[0].steps[1].payloadId`.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- --run test/control-plane-project-manifest.test.ts`

Expected: FAIL because the module and exported interfaces do not exist.

- [ ] **Step 3: Implement the V2 manifest types and validator**

Implement:

```ts
validateControlPlaneProject(value: unknown): ControlPlaneValidationResult
migrateFrontpageConfigToControlPlane(config: FrontpageConfig): ControlPlaneProjectV2
```

Use explicit discriminated unions for function, strategy, payload, and workflow step kinds. Preserve V1 hero, chain, contract, and action behavior during migration.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- --run test/control-plane-project-manifest.test.ts`

Expected: all project-manifest tests pass.

- [ ] **Step 5: Commit the manifest foundation**

```bash
git add src/lib/control-plane/project-manifest.ts test/control-plane-project-manifest.test.ts
git commit -m "feat: add versioned ST3 control plane manifest"
```

### Task 2: Compile Complete ABIs Deterministically

**Files:**
- Create: `src/lib/control-plane/abi-compiler.ts`
- Create: `test/control-plane-abi-compiler.test.ts`
- Modify: `src/lib/contract-actions.ts`
- Test: `test/contract-actions.test.ts`

**Interfaces:**
- Consumes: `ControlPlaneProjectV2.contract.abi` and per-signature function configuration.
- Produces: `compileContractAbi(input: CompileAbiInput): CompileAbiResult`, canonical function records, skipped-entry diagnostics, and stable signature-derived IDs.

- [ ] **Step 1: Write failing ABI compilation tests**

Test a mixed ABI containing read, write, payable, overloaded functions, `(address,uint256)[]`, `(bytes32,(uint256,bool)[])`, events, errors, a duplicate, and a malformed tuple. Assert exact canonical signatures, distinct overload IDs, callable count, and indexed malformed-tuple diagnostics.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- --run test/control-plane-abi-compiler.test.ts test/contract-actions.test.ts`

Expected: FAIL because complete ABI compilation and deterministic IDs are missing.

- [ ] **Step 3: Implement ABI guards, canonical types, and deterministic IDs**

Implement:

```ts
compileContractAbi(input: CompileAbiInput): CompileAbiResult
canonicalAbiParameterType(parameter: AbiParameter): string
functionIdForSignature(signature: string): string
```

Use recursive tuple expansion and a stable signature hash. Non-function entries are skipped with informational diagnostics; malformed function entries are errors.

- [ ] **Step 4: Adapt V1 contract actions to the canonical compiler**

Replace duplicate signature logic in `contract-actions.ts` with the shared canonical function. Preserve all existing V1 outputs.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- --run test/control-plane-abi-compiler.test.ts test/contract-actions.test.ts`

Expected: all ABI and legacy action tests pass.

- [ ] **Step 6: Commit complete ABI compilation**

```bash
git add src/lib/control-plane/abi-compiler.ts src/lib/contract-actions.ts test/control-plane-abi-compiler.test.ts test/contract-actions.test.ts
git commit -m "feat: compile complete contract ABIs"
```

### Task 3: Normalize ABI Values and Format Results

**Files:**
- Create: `src/lib/control-plane/value-codec.ts`
- Create: `test/control-plane-value-codec.test.ts`
- Modify: `src/lib/execute-contract-action.ts`
- Test: `test/execute-contract-action.test.ts`

**Interfaces:**
- Consumes: ABI parameters and raw dashboard/runtime values.
- Produces: `normalizeAbiValue(parameter, value)`, `normalizeFunctionArguments(method, values)`, and `toJsonSafeContractResult(value)`.

- [ ] **Step 1: Write failing recursive codec tests**

Cover `uint256` above `Number.MAX_SAFE_INTEGER`, negative `int256`, booleans, fixed arrays, dynamic arrays, tuple objects, positional tuples, nested tuple arrays, invalid JSON, fixed-array length mismatch, and bigint result formatting.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- --run test/control-plane-value-codec.test.ts test/execute-contract-action.test.ts`

Expected: FAIL on missing codec exports and unsupported fixed/nested structures.

- [ ] **Step 3: Implement the recursive codec**

Keep integer values as `bigint`. Validate fixed-array lengths and required tuple components. Return path-aware errors such as `orders[1].amount must be uint256`.

- [ ] **Step 4: Route existing action preparation through the shared codec**

Remove duplicated normalization from `execute-contract-action.ts` while preserving its public signature.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- --run test/control-plane-value-codec.test.ts test/execute-contract-action.test.ts`

Expected: all codec and transaction-preparation tests pass.

- [ ] **Step 6: Commit value normalization**

```bash
git add src/lib/control-plane/value-codec.ts src/lib/execute-contract-action.ts test/control-plane-value-codec.test.ts test/execute-contract-action.test.ts
git commit -m "feat: normalize complete ABI value types"
```

### Task 4: Repair and Generalize the Transaction-Payload Engine

**Files:**
- Modify: `src/lib/transaction-payload.ts`
- Create: `src/lib/control-plane/payload-compiler.ts`
- Create: `test/transaction-payload.test.ts`
- Create: `test/control-plane-payload-compiler.test.ts`

**Interfaces:**
- Consumes: a compiled function, validated values, chain, contract, optional value, and strategy metadata.
- Produces: `buildCompiledTransactionPayload(input): CompiledTransactionPayload` and `compilePayloadDefinitions(project, functions): PayloadCompileResult`.

- [ ] **Step 1: Write failing payload regression tests**

Assert that an overloaded one-item ABI encodes the expected selector, large integers remain exact, payable value becomes hexadecimal, missing required arguments fail with a path, and no function or argument is silently substituted.

- [ ] **Step 2: Run focused tests and TypeScript to verify RED**

Run: `npm test -- --run test/transaction-payload.test.ts test/control-plane-payload-compiler.test.ts && ./node_modules/.bin/tsc --noEmit --pretty false`

Expected: tests fail on missing generic payload API and TypeScript reports the current line-256 `never` error.

- [ ] **Step 3: Replace the independent `never` casts with a typed ABI boundary**

Use Viem `Abi` at the validated boundary and pass the one-item selected function ABI, its string name, and normalized arguments as one correlated encode request. Do not add `as any` or another suppression.

- [ ] **Step 4: Implement payload definition compilation**

Validate function IDs, explicit defaults, strategy references, and native value. Return structured diagnostics for every rejected payload.

- [ ] **Step 5: Run focused tests and TypeScript to verify GREEN**

Run: `npm test -- --run test/transaction-payload.test.ts test/control-plane-payload-compiler.test.ts && ./node_modules/.bin/tsc --noEmit --pretty false`

Expected: payload tests pass and TypeScript exits 0.

- [ ] **Step 6: Commit the payload repair**

```bash
git add src/lib/transaction-payload.ts src/lib/control-plane/payload-compiler.ts test/transaction-payload.test.ts test/control-plane-payload-compiler.test.ts
git commit -m "fix: connect typed transaction payload compilation"
```

### Task 5: Add the Strategy Module Registry

**Files:**
- Create: `src/lib/control-plane/strategy-registry.ts`
- Create: `test/control-plane-strategy-registry.test.ts`
- Modify: `src/lib/strategy-preset-bindings.ts`
- Test: `test/strategy-preset-bindings.test.ts`

**Interfaces:**
- Consumes: strategy IDs, function capabilities, project chain, and configured dependency modules.
- Produces: `resolveStrategyModules(ids)`, `validateStrategyCompatibility(strategy, fn)`, and `compileStrategies(project, functions)`.

- [ ] **Step 1: Write failing dependency and compatibility tests**

Test deterministic dependency order, unknown module rejection, cycle rejection, read/write/payable compatibility, explicit mapped function preference, and pattern fallback.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- --run test/control-plane-strategy-registry.test.ts test/strategy-preset-bindings.test.ts`

Expected: FAIL because the registry and resolver are missing.

- [ ] **Step 3: Implement declarative modules and dependency resolution**

Use depth-first resolution with active/complete visitation sets. Registry entries declare `id`, `label`, `dependencies`, supported mutabilities, required configuration, and payload transformation ID.

- [ ] **Step 4: Adapt existing preset bindings to the registry interface**

Keep the repaired ABI-function selection and expose existing presets through typed compatibility metadata rather than duplicate lookup logic.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- --run test/control-plane-strategy-registry.test.ts test/strategy-preset-bindings.test.ts`

Expected: all strategy tests pass.

- [ ] **Step 6: Commit strategy resolution**

```bash
git add src/lib/control-plane/strategy-registry.ts src/lib/strategy-preset-bindings.ts test/control-plane-strategy-registry.test.ts test/strategy-preset-bindings.test.ts
git commit -m "feat: add strategy module resolution"
```

### Task 6: Compile Validated Workflows

**Files:**
- Create: `src/lib/control-plane/workflow-compiler.ts`
- Create: `test/control-plane-workflow-compiler.test.ts`

**Interfaces:**
- Consumes: compiled functions, strategies, payloads, and workflow configuration.
- Produces: `compileWorkflows(input): WorkflowCompileResult` and serializable `CompiledWorkflow` records used by the runtime.

- [ ] **Step 1: Write failing workflow tests**

Test an ordered read→write flow, condition on a prior read result, fallback routing, missing references, duplicate step IDs, unreachable steps, and a removed-function stale reference.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- --run test/control-plane-workflow-compiler.test.ts`

Expected: FAIL because the compiler is missing.

- [ ] **Step 3: Implement workflow validation and compilation**

Support ordered steps with explicit `next`, `onError`, and typed condition records. Reject arbitrary JavaScript and cycles unless a future schema explicitly defines bounded repetition.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- --run test/control-plane-workflow-compiler.test.ts`

Expected: all workflow tests pass.

- [ ] **Step 5: Commit workflow compilation**

```bash
git add src/lib/control-plane/workflow-compiler.ts test/control-plane-workflow-compiler.test.ts
git commit -m "feat: compile validated strategy workflows"
```

### Task 7: Build the Complete Standalone Runtime

**Files:**
- Create: `src/lib/control-plane/runtime-contract.ts`
- Create: `src/lib/control-plane/runtime-execution.ts`
- Create: `test/control-plane-runtime-execution.test.ts`
- Modify: `src/lib/frontpage-script-compiler.ts`
- Modify: `test/frontpage-script-compiler.test.ts`

**Interfaces:**
- Consumes: validated `CompiledProjectManifestV2` and an EIP-1193 provider.
- Produces: `executeCompiledFunction`, `executeCompiledWorkflow`, browser events, inline function cards, decoded read results, and wallet-confirmed write hashes.

- [ ] **Step 1: Write failing provider and runtime tests**

Use a fake EIP-1193 provider. Assert exact `eth_call`, `eth_requestAccounts`, `wallet_switchEthereumChain`, and `eth_sendTransaction` requests; decoded read output; overload selectors; transaction rejection display; and workflow fallback behavior.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- --run test/control-plane-runtime-execution.test.ts test/frontpage-script-compiler.test.ts`

Expected: FAIL because read execution, workflows, filters, and V2 manifest bundling are missing.

- [ ] **Step 3: Implement provider execution primitives**

Implement:

```ts
executeCompiledFunction(input: RuntimeFunctionExecutionInput): Promise<RuntimeExecutionResult>
executeCompiledWorkflow(input: RuntimeWorkflowExecutionInput): Promise<RuntimeWorkflowResult>
```

Use Viem encode/decode utilities and the shared value codec. Keep provider access injectable for tests.

- [ ] **Step 4: Expand the generated Shadow DOM UI**

Render All/Read/Write/Payable filters, one card per enabled function, canonical signatures, recursive value hints, explicit payable value, per-card results, global status, and workflow controls.

- [ ] **Step 5: Preserve and extend the browser API**

Expose `actions`, `workflows`, `runAction(id, values?, options?)`, and `runWorkflow(id, inputs?)` while preserving `mount`, `root`, `connect`, and `on`.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npm test -- --run test/control-plane-runtime-execution.test.ts test/frontpage-script-compiler.test.ts`

Expected: runtime and generated-script tests pass; `new Function(result.script)` succeeds.

- [ ] **Step 7: Commit the runtime**

```bash
git add src/lib/control-plane/runtime-contract.ts src/lib/control-plane/runtime-execution.ts src/lib/frontpage-script-compiler.ts test/control-plane-runtime-execution.test.ts test/frontpage-script-compiler.test.ts
git commit -m "feat: generate complete standalone contract runtime"
```

### Task 8: Connect the V2 Compile Service and Artifact Metadata

**Files:**
- Create: `src/lib/control-plane/artifact-version.ts`
- Modify: `src/lib/frontpage-compile-service.ts`
- Modify: `src/app/api/frontpage/compile/route.ts`
- Modify: `src/lib/script-build-store.ts`
- Test: `test/frontpage-compile-route.test.ts`
- Test: `test/script-build-store.test.ts`

**Interfaces:**
- Consumes: V1 frontpage payload or validated V2 project manifest.
- Produces: `script.js`, version, integrity, resolved modules, diagnostics, action/workflow summary, and stored build metadata.

- [ ] **Step 1: Write failing compile metadata tests**

Assert deterministic manifest hash, `sha256-...` integrity, V2 function/workflow summary, preserved V1 compilation, invalid-reference rejection, and stored metadata without using bundle content as a filename.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- --run test/frontpage-compile-route.test.ts test/script-build-store.test.ts`

Expected: FAIL on missing V2 metadata and artifact versioning.

- [ ] **Step 3: Implement artifact identity and V2 compile orchestration**

Implement:

```ts
createArtifactVersion(manifest: CompiledProjectManifestV2, script: string): ArtifactVersion
compileFrontpagePayload(payload: unknown): Promise<CompiledFrontpagePayload>
```

Canonicalize manifest serialization before hashing. Keep V1 migration inside the service boundary.

- [ ] **Step 4: Persist complete build metadata**

Store source manifest ID, version, integrity, size, resolved modules, timestamp, status, and filename. Never store secrets in generated browser configuration.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- --run test/frontpage-compile-route.test.ts test/script-build-store.test.ts`

Expected: all compile and storage tests pass.

- [ ] **Step 6: Commit compile orchestration**

```bash
git add src/lib/control-plane/artifact-version.ts src/lib/frontpage-compile-service.ts src/app/api/frontpage/compile/route.ts src/lib/script-build-store.ts test/frontpage-compile-route.test.ts test/script-build-store.test.ts
git commit -m "feat: version standalone control plane artifacts"
```

### Task 9: Build the No-Code Dashboard Control Plane

**Files:**
- Create: `src/components/control-plane/ProjectSettings.tsx`
- Create: `src/components/control-plane/AbiStudio.tsx`
- Create: `src/components/control-plane/FunctionCatalogue.tsx`
- Create: `src/components/control-plane/PayloadInspector.tsx`
- Create: `src/components/control-plane/StrategyWorkflowBuilder.tsx`
- Create: `src/components/control-plane/InterfaceStudio.tsx`
- Create: `src/components/control-plane/AutomationBuildPanel.tsx`
- Create: `src/lib/control-plane/project-store.ts`
- Create: `test/control-plane-project-store.test.ts`
- Modify: `src/app/frontpage/page.tsx`

**Interfaces:**
- Consumes: `ControlPlaneProjectV2`, compile diagnostics, preview artifact, and build metadata.
- Produces: dashboard-only project edits through typed update callbacks and a validated V2 compile request.

- [ ] **Step 1: Write failing project-store tests**

Test create, save, reload, clone, migrate V1, reject unsupported future schema, preserve bigint-compatible decimal strings, and restore a selected build version.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- --run test/control-plane-project-store.test.ts`

Expected: FAIL because the store is missing.

- [ ] **Step 3: Implement the project store**

Use a versioned storage envelope. Expose `listProjects`, `loadProject`, `saveProject`, `cloneProject`, and `deleteProject` with explicit IDs; UI deletion requires confirmation but store tests exercise only exact-ID deletion.

- [ ] **Step 4: Build focused dashboard components**

Each component receives only its configuration slice and typed update callback. Normal controls cover every required setting; advanced JSON is read-only by default and is not required to compile.

- [ ] **Step 5: Compose components in the existing frontpage route**

Replace the monolithic form sections incrementally while preserving existing project import, preview, and download behavior. The dashboard must show ABI diagnostics, function counts, payload preview, workflow validation, automation state, build version, integrity, and output size.

- [ ] **Step 6: Run focused and existing tests**

Run: `npm test -- --run test/control-plane-project-store.test.ts test/frontpage-compile-route.test.ts test/frontpage-script-compiler.test.ts`

Expected: all selected tests pass.

- [ ] **Step 7: Commit the control plane**

```bash
git add src/components/control-plane src/lib/control-plane/project-store.ts src/app/frontpage/page.tsx test/control-plane-project-store.test.ts
git commit -m "feat: build the ST3 no-code control plane"
```

### Task 10: Add Automatic Validation, Preview, and Build Control

**Files:**
- Create: `src/lib/control-plane/automation-controller.ts`
- Create: `test/control-plane-automation-controller.test.ts`
- Modify: `src/components/control-plane/AutomationBuildPanel.tsx`
- Modify: `src/app/frontpage/page.tsx`

**Interfaces:**
- Consumes: project revision, automation policy, async validate/preview/build functions.
- Produces: serialized automation states `idle | validating | previewing | building | ready | error`, cancellation/supersession behavior, and latest artifact identity.

- [ ] **Step 1: Write failing automation state-machine tests**

Use controlled promises to prove off mode does nothing, on mode validates then previews then builds, invalid projects stop before preview, rapid revisions supersede earlier work, and a slower old build cannot replace the newest artifact.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- --run test/control-plane-automation-controller.test.ts`

Expected: FAIL because the controller is missing.

- [ ] **Step 3: Implement the automation controller**

Implement `createAutomationController(dependencies)` with monotonically increasing revision tokens and debounced scheduling. Only the active revision may publish state or artifacts.

- [ ] **Step 4: Connect the dashboard automation switch**

Off mode exposes explicit Validate, Preview, and Compile buttons. On mode displays the live stage and automatically regenerates a draft artifact after valid configuration changes.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- --run test/control-plane-automation-controller.test.ts`

Expected: all automation tests pass.

- [ ] **Step 6: Commit automatic build control**

```bash
git add src/lib/control-plane/automation-controller.ts src/components/control-plane/AutomationBuildPanel.tsx src/app/frontpage/page.tsx test/control-plane-automation-controller.test.ts
git commit -m "feat: add dashboard automation control"
```

### Task 11: Add the Dedicated Artifact Command and Browser Smoke Test

**Files:**
- Create: `scripts/compile-control-plane.mjs`
- Create: `test/control-plane-e2e.test.ts`
- Create: `test/fixtures/control-plane-project.json`
- Create: `test/fixtures/control-plane-smoke.html`
- Modify: `package.json`

**Interfaces:**
- Consumes: a saved V2 project JSON path and output directory.
- Produces: `script.js`, `manifest.json`, integrity metadata, and nonzero exit on diagnostics.

- [ ] **Step 1: Write failing CLI and end-to-end tests**

Compile the fixture containing read, write, payable, overload, tuple, and nested-array functions. Assert generated files, summaries, integrity, JavaScript syntax, and failure for a stale workflow reference.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- --run test/control-plane-e2e.test.ts`

Expected: FAIL because the CLI is missing.

- [ ] **Step 3: Implement the dedicated compiler command**

Add `npm run build:control-plane -- --project <path> --out <directory>`. Resolve the local TypeScript compiler service without downloading dependencies or touching unrelated projects.

- [ ] **Step 4: Run the CLI test and compile the fixture**

Run: `npm test -- --run test/control-plane-e2e.test.ts && npm run build:control-plane -- --project test/fixtures/control-plane-project.json --out /tmp/st3-control-plane-smoke`

Expected: test passes and output contains `script.js` plus manifest metadata.

- [ ] **Step 5: Run browser smoke verification**

Serve the fixture page locally and verify automatic mount, filters, decoded read result, generated write transaction request, workflow status, fallback root, and zero uncaught runtime errors using the Playwright workflow.

- [ ] **Step 6: Commit the reproducible artifact command**

```bash
git add scripts/compile-control-plane.mjs test/control-plane-e2e.test.ts test/fixtures/control-plane-project.json test/fixtures/control-plane-smoke.html package.json
git commit -m "test: verify standalone control plane artifacts"
```

### Task 12: Full Production Verification and Documentation

**Files:**
- Modify: `docs/architecture/frontend-script-source-of-truth.md`
- Create: `docs/control-plane/operator-guide.md`
- Update: `docs/superpowers/plans/2026-09-28-st3-control-plane-consolidation.md` task checkboxes only as work completes.

**Interfaces:**
- Consumes: completed implementation and build evidence.
- Produces: final runbook, source-of-truth map, and verified commands.

- [ ] **Step 1: Run the complete test suite**

Run: `npm test -- --run`

Expected: every test file and test passes with exit code 0.

- [ ] **Step 2: Run TypeScript and diff checks**

Run: `./node_modules/.bin/tsc --noEmit --pretty false && git diff --check`

Expected: both commands exit 0 with no TypeScript or whitespace errors.

- [ ] **Step 3: Run the complete production build**

Run: `npm run build`

Expected: Next.js production build exits 0. Record warnings separately; no warning may be described as a fatal blocker unless it causes a nonzero exit.

- [ ] **Step 4: Run the dedicated artifact build and browser smoke test again**

Run the Task 11 fixture command from a clean output directory and repeat the browser smoke assertions.

Expected: reproducible artifact identity for the same canonical manifest and no runtime errors.

- [ ] **Step 5: Write the no-code operator guide**

Document: create project, import ABI, select functions, configure payloads, choose strategies, build workflows, set automation, configure UI, preview, compile, download, verify integrity, and embed the relative script tag.

- [ ] **Step 6: Review the final diff and preserve unrelated work**

Run: `git status --short` and `git diff --stat`.

Expected: all pre-existing unrelated changes remain intact and are explicitly separated from the completed control-plane commits.

- [ ] **Step 7: Commit documentation**

```bash
git add docs/architecture/frontend-script-source-of-truth.md docs/control-plane/operator-guide.md docs/superpowers/plans/2026-09-28-st3-control-plane-consolidation.md
git commit -m "docs: document ST3 control plane operation"
```
