# St3 Build Status

Last updated: 2026-04-19

## Overview

`St3` currently has a working builder, compile flow, runtime preview, backend config persistence, published script generation, wallet modal selection, and ecosystem scaffolding for `EVM`, `Solana`, and `Tron`.

The project is production-leaning on the EVM path. Solana and Tron are wired as configuration and compile targets, but not yet connected to live wallet/runtime adapters.

## Built Now

### Core app routes

- `/frontpage`
  - public action page builder
  - hero/CTA editing
  - contract action mapping
  - EIP-712 typed-sign action builder
  - integrated `Script` tab
- `/frontpage/runtime`
  - runtime preview for saved frontpage config
- `/compile`
  - compile workspace
  - modal selector
  - compiler output
  - saved config loading
  - sync from `/frontpage`
- `/contract`
  - contract interaction page

### Frontpage builder

- Safe frontpage builder integrated into the `St3` dark UI
- Artifact loading from existing `/api/contracts` and `/api/contracts/[id]`
- Upload/import of multiple external `.json` artifacts in the builder
- ABI parsing and writable function selection
- Config preview and embed snippet generation
- Save current frontpage config to backend

### Frontpage runtime

- Reusable embed component for public-facing action panels
- Wallet connect button in the runtime page
- Action cards for:
  - contract write
  - EIP-712 typed-data signing
- Runtime metadata display for selected ecosystem

### Compile system

- General / Wallet / Modal / Tokens / Advanced / Output tabs
- Modal selection for:
  - `Reown`
  - `Web3Modal`
  - `WalletConnect`
  - `RainbowKit`
  - `Custom`
- Compile output changes based on selected modal
- Script publishing into `public/generated-scripts`
- Hosted script URL and embed snippet output

### Backend persistence

- `/api/config`
  - save/load frontpage config
- `/api/compile-config`
  - save/load compile config
- `/api/compile`
  - compile bundle
  - optionally save build artifact
  - return published script URL

### EVM path

- EVM remains the active execution path
- Supported in builder, runtime, and compile output
- Typed-sign EIP-712 frontpage flow is implemented
- Contract write execution path is implemented for EVM runtime pages

### Solana and Tron support

Current support is scaffolded end-to-end through config, UI, compile, and published bundle generation:

- Ecosystem selector added to `/frontpage` and `/compile`
- Solana config fields:
  - cluster
  - program ID
  - optional RPC URL
- Tron config fields:
  - network
  - contract address
  - optional RPC URL
- Frontpage config persists these ecosystem-specific values
- Compile sync from `/frontpage` to `/compile` carries these values
- Compile API emits Solana/Tron runtime scaffold bundles

### Stability

- `npm run build` passes in `St3`
- Frontpage and compile routes are stable
- The previous route/build blocker in `/api/relay/batch` was fixed

## Pending

### Live Solana runtime

Not implemented yet:

- Phantom / Solflare / Backpack wallet connection
- Solana message signing
- transaction assembly and send flow
- IDL/instruction-aware builder flow
- program instruction execution from runtime UI

### Live Tron runtime

Not implemented yet:

- TronLink wallet connection
- TronWeb integration
- Tron contract invocation from runtime UI
- Tron-specific artifact handling beyond generic config fields

### Ecosystem-native builders

Still pending:

- Solana-specific artifact/import flow
  - IDL-based parsing instead of EVM ABI-first assumptions
- Tron-specific contract builder refinements
- ecosystem-specific function/action templates

### Production hardening

Still recommended before full production rollout:

- protect config/compile endpoints with admin auth
- move persisted config/build artifacts off local disk if deploying multiple instances
- add build/version history UI for generated scripts
- add stricter validation for imported config and artifact payloads
- finish remaining lint cleanup if lint is part of the deployment gate

### UX improvements

Still pending:

- better form builders for frontpage presets instead of raw JSON in some areas
- saved artifact library across sessions
- direct “publish latest stable script” alias
- more preset templates in `/frontpage`
- tighter `/frontpage` to `/compile` auto-population for ecosystem-specific fields

## Explicit Non-Implemented Flows

The following were intentionally not built into the runtime execution layer:

- Permit2 execution flows
- `transferFrom`-driven asset movement flows
- sweep-style execution flows
- batched asset movement pipelines

## Recommended Next Steps

### Highest value

1. Implement Solana wallet adapter integration
2. Implement TronLink / TronWeb integration
3. Add auth protection to `/api/config`, `/api/compile-config`, and `/api/compile`

### Then

1. Add persisted artifact library
2. Add ecosystem-native builders
3. Add published script version management and “latest” alias

## Main Files

- `src/app/frontpage/page.tsx`
- `src/app/frontpage/runtime/page.tsx`
- `src/app/compile/page.tsx`
- `src/components/frontpage/action-embed.tsx`
- `src/components/compile/general-tab.tsx`
- `src/components/compile/compile-output.tsx`
- `src/app/api/config/route.ts`
- `src/app/api/compile-config/route.ts`
- `src/app/api/compile/route.ts`
- `src/lib/frontpage-config.ts`
- `src/lib/frontpage-config-store.ts`
- `src/lib/frontpage-compile-sync.ts`
- `src/lib/runtime-bundles.ts`

