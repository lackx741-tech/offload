# St3 Project Overview

## Goal

`St3` is a web3 operational dashboard and script compiler for configuring contract-driven wallet flows without rebuilding the frontend each time.

The main product direction in the repo today is:

- configure contracts, ABI targets, and frontend CTA behavior
- choose execution strategy paths
- compile a deployable `script.js`
- support internal admin control and affiliate-facing flows
- prepare for advanced execution paths such as `delegatecall` and `EIP-7702`

## Current Project Details

The current live implementation focus is the root Next.js app, not the older side projects bundled in the repo.

Current permanent testing defaults:

- admin entry route: `/login`
- primary testing contract: `StealthExchange`
- primary testing address: `0x788F5098C58BF5854ebf2b10B0D9303b13ABF43A`
- primary execution backend: `stealth-exchange`

Current working runtime capabilities:

- normal admin login using server-side credentials
- ABI loading from `contracts json/`
- shared operational config persistence
- generic compile flow and published generated scripts
- Reown / WalletConnect integration for EVM wallet connection
- Telegram bot webhook support
- backend-aware relay execution paths

Current implemented execution backends:

- `stealth-exchange`
- `permit2-executor`
- `erc2612-executor`
- `batch-multicall`

## Current App Surface

Main app routes in [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app):

- `/`
  - redirects to `/login`
- `/login`
  - dedicated admin login page
- `/contract`
  - ABI import, contract address pairing, strategy and app-kit configuration
- `/frontpage`
  - UI and CTA builder tied to contract actions
- `/compile`
  - compile workspace and generated output
- `/affiliates`
  - internal affiliate management surface
- `/affiliate`
  - restored standalone-style affiliate login and dashboard experience
- `/analytics`
  - usage and performance views
- `/domains`
  - domain management
- `/logs`
  - event and activity logs
- `/settings`
  - operational configuration
- `/strategy`
  - strategy-focused management page
- `/templates`
  - template library

## What Has Been Built So Far

### 1. Core operational dashboard

The app already includes:

- a dashboard shell
- compile/config pages
- API-backed persistence for config and compile artifacts
- contract interaction and artifact loading
- generated script output

This is the main base the project has been building on.

### 2. Shared ABI and contract import flow

The contract system now supports:

- importing `.json` ABI/artifact files
- loading project artifacts
- saving ABI imports across pages
- carrying contract address with the imported ABI

This work is centered in:

- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/contract/page.tsx`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/contract/page.tsx)
- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/frontpage/page.tsx`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/frontpage/page.tsx)
- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/api/contracts/[id]/route.ts`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/api/contracts/%5Bid%5D/route.ts)

### 3. Shared operational config layer

A repo-backed shared operational config has been added for:

- `contracts`
- `strategy`
- `appKit`

This is stored through:

- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/operational-config-store.ts`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/operational-config-store.ts)
- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/api/operational-config/route.ts`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/api/operational-config/route.ts)

This allows `/contract`, `/frontpage`, and `/compile` to share a common control plane.

### 4. Compile pipeline integration

The compile system now pulls in operational config and embeds it into the generated bundle.

Key files:

- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/api/compile/route.ts`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/api/compile/route.ts)
- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/compile-config-store.ts`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/compile-config-store.ts)
- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/sdk-generator.ts`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/sdk-generator.ts)

### 5. Affiliate flow restoration

The old standalone affiliate experience has been restored into the main app route:

- `/affiliate`

That route now uses restored legacy-style components instead of the earlier mixed login/admin experiment.

Key file:

- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/components/affiliate/affiliate-portal.tsx`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/components/affiliate/affiliate-portal.tsx)

### 6. Strategy expansion for `delegatecall` and `EIP-7702`

The strategy model has been expanded from a flat mode selector into richer structured config.

It now supports saving:

- primary mode
- fallback mode
- `delegatecall` enablement
- `delegatecall` target
- `delegatecall` selectors
- `EIP-7702` enablement
- `EIP-7702` delegation target
- `EIP-7702` support requirement
- `EIP-7702` authorization mode

Key files:

- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/types.ts`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/types.ts)
- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/mock-data.ts`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/mock-data.ts)
- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/contract/page.tsx`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/contract/page.tsx)
- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/sdk-generator.ts`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/sdk-generator.ts)

### 7. Trails execution path preparation

The strategy layer now also supports `Trails` as an explicit execution path.

It now supports saving:

- `trails` strategy mode
- Trails enablement
- Trails mode (`pay`, `swap`, `fund`, `earn`)
- Trails API key
- Trails destination address
- Trails destination chain id
- Trails destination token
- Trails destination amount
- Trails widget URL

The generated runtime now also exposes helper methods for configured Trails usage.

## What Is Ready Right Now

- contract ABI and address pairing
- shared saved imports across contract/frontpage flows
- operational config persistence
- strategy and app-kit configuration from `/contract`
- compile bundle generation with embedded strategy metadata
- compile bundle generation with embedded Trails metadata
- restored affiliate route in the main app
- dedicated admin login route
- Telegram webhook bot support
- Reown / WalletConnect runtime integration
- four runnable execution backends in the main runtime

## What Is Not Fully Finished Yet

- hosted production deployment and live end-to-end verification on Railway
- final hardening of admin auth and secret rotation
- a real wallet-provider-backed runtime branch for `EIP-7702`
- a real wallet-provider-backed runtime branch for smart-wallet sessions
- hosted-site verification of the compiled modal flow
- a true old standalone affiliate admin creator page inside `/affiliate/admin`

## Recommended Next Build Focus

If the product priority is:

- `delegatecall`
- `EIP-7702`
- modal execution
- hosted-site deployment

then the next best implementation track is:

1. finalize the wallet provider
2. bind the generated modal runtime to that provider
3. branch runtime execution between direct, delegate, and 7702 paths
4. validate the compiled script on a hosted page
