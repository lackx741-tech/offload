# St3 Architecture

Last verified: 2026-07-28

The governing completion target is defined in `END_GAME.md`.

## Purpose

St3 is a dashboard-controlled compiler for EVM wallet and contract workflows. An administrator configures the wallet UI, contract ABI, deployed addresses, function bindings, strategy, payout, and relay behavior. St3 then generates a hosted JavaScript bundle for use on another website.

This document describes current architecture. Planned work belongs in `Plans.md`.

## Source-of-Truth Order

When documentation or code appears inconsistent, verify in this order:

1. Current source code and tests/build output
2. `data/operational-config.json`
3. `data/compile-config.json`
4. This document and `DECISIONS.md`
5. Older files under `docs/`

Never infer a deployed state from a local build. Never infer a configured value from a template environment file.

## System Flow

```text
Dashboard
  /contract  -> ABI, address, function bindings, execution backend
  /compile   -> wallet, modal, tokens, advanced behavior, payout
       |
       v
Persisted configuration
  data/operational-config.json
  data/compile-config.json
       |
       v
Compiler
  src/lib/live-compile-bundle.ts
  src/lib/sdk-generator.ts
       |
       v
Hosted bundle
  public/generated-scripts/stealthv26-latest.min.js
       |
       v
Customer website
  wallet connection -> configured scan/sign/action pipeline
       |
       v
St3 backend
  /api/relay/batch -> server relayer -> selected contract
```

## Control Plane

### Contract configuration

- Route: `/contract`
- Artifact discovery: `/api/contracts`
- Artifact loading: `/api/contracts/[id]`
- Registered raw ABIs: `abi/`
- Additional artifacts: `contracts json/`
- Registry: `src/lib/contract-registry.ts`
- Standard bindings: `src/lib/standard-function-bindings.ts`

The artifact API supports both raw ABI arrays and artifact objects containing an `abi` property.

### Compile configuration

- Route: `/compile`
- API: `/api/compile`
- Persisted config: `data/compile-config.json`
- Operational config: `data/operational-config.json`
- Generator: `src/lib/sdk-generator.ts`
- Stable output: `public/generated-scripts/stealthv26-latest.min.js`
- Versioned outputs: `public/generated-scripts/stealthv26-*.min.js`

The dashboard is the intended control surface. Generated runtime behavior must follow compiled dashboard settings rather than hardcoded policy.

## Wallet and Session Plane

- App-level provider: `src/components/wallet-provider.tsx`
- Shared Sequence config: `src/lib/sequence-config.ts`
- Session panel: `/sessions`
- Session panel runtime: St3-hosted `stealthv26-latest.min.js`

The Sessions page does not depend on `localhost:4173`. It loads the St3-hosted bundle and uses the global SDK session methods:

- `createSession`
- `getActiveSession`
- `clearSession`
- `executeWithSession`

## Generated Website Runtime

The normal website embed is:

```html
<script
  type="module"
  src="https://structure.v26sequence.com/generated-scripts/stealthv26-latest.min.js"
></script>

<div data-sv26-button></div>
```

The standalone button is the UI entry point. Post-connect behavior is controlled by compiled dashboard options:

- balance rules and balance-based approval determine whether balance data is required
- `Auto Signature Prompt` controls automatic post-connect execution/signing
- strategy settings select the execution path
- action-button settings control explicit action handling
- relay calls use the compiled public relay URL

## Execution Plane

Primary relay route:

- `POST /api/relay/batch`

Implemented execution backends:

- `stealth-exchange`
- `permit2-executor`
- `erc2612-executor`
- `batch-multicall`
- EIP-7702 branch where enabled and supported

Generated standard bindings currently cover:

- StealthExchange
- Permit2Executor
- ERC2612Executor
- BatchMulticall
- SessionManager
- EIP7702Module
- Stage1Module
- Stage2Module
- Factory

Contract execution must use the selected ABI, deployed address, function binding, strategy, and chain. A successful compile does not prove that a deployed contract authorizes the server relayer.

## Relayer Boundary

- The browser receives only the public relay URL.
- `RELAYER_PRIVATE_KEY` is server-only.
- The private key must never appear in generated JavaScript, browser configuration, logs, documentation, or a `NEXT_PUBLIC_*` variable.
- The relayer address must be funded for gas and authorized by every contract/backend that requires it.

## Deployment Plane

The Next.js app uses `output: "standalone"`.

Standalone packaging requires:

```text
.next/standalone/
  server.js
  .next/static/
  public/
```

After every production build, copy `.next/static` and `public` into the standalone package before starting `server.js`. Missing this step produces unstyled HTML because `/_next/static/css/*` returns 404.

Local standalone start:

```bash
cd .next/standalone
PORT=3000 HOSTNAME=127.0.0.1 node server.js
```

## Verification Rules

Before declaring a feature complete:

1. Inspect the exact source and persisted configuration.
2. Run `npm run sdk:sync` when generator/config changes affect the hosted bundle.
3. Run `npm run build`.
4. Package standalone static and public assets.
5. Verify the page, CSS, generated script, and relevant API return expected HTTP statuses.
6. Treat wallet signatures and on-chain execution as unverified until tested with an explicitly approved test wallet and transaction.
