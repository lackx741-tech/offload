# St3 Architecture

## High-Level Model

The project is now best understood as four layers:

1. `Control layer`
   - config pages and admin surfaces
2. `Compile layer`
   - normalized config to generated script
3. `Wallet/modal layer`
   - user wallet connection and session UX
4. `Execution layer`
   - direct contract calls, `delegatecall`, and `EIP-7702`

## Layer 1: Control Layer

Primary routes:

- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/contract/page.tsx`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/contract/page.tsx)
- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/frontpage/page.tsx`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/frontpage/page.tsx)
- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/compile/page.tsx`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/compile/page.tsx)

Responsibilities:

- load/import ABI artifacts
- pair ABI with contract addresses
- select callable functions
- configure strategy mode and execution details
- configure app-kit values and branding
- drive compile output

## Layer 2: Shared Config Layer

The project now has a shared operational config model:

- `contracts`
- `strategy`
- `appKit`

Persistence:

- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/operational-config-store.ts`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/operational-config-store.ts)
- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/api/operational-config/route.ts`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/api/operational-config/route.ts)

This layer is the source of truth for contract routing and execution strategy.

## Layer 3: Compile Layer

Main files:

- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/api/compile/route.ts`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/api/compile/route.ts)
- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/compile-config-store.ts`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/compile-config-store.ts)
- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/sdk-generator.ts`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/sdk-generator.ts)

Responsibilities:

- load normalized config
- merge compile config with operational config
- produce generated runtime bundle
- embed contract, strategy, and app-kit metadata into `script.js`

## Layer 4: Wallet and Modal Layer

Current state:

- wallet/modal configuration exists in the compile system
- generated bundle already includes app-kit and strategy metadata
- provider-specific execution is not fully finalized yet

Planned responsibility split:

- wallet provider handles connect, session, and capability detection
- modal runtime handles user interaction
- generated runtime chooses the correct execution path

## Layer 5: Execution Layer

The execution model should be treated as three distinct paths:

### 1. Direct path

Use for:

- normal contract writes
- simple reads/writes without router indirection

### 2. Delegate path

Use for:

- module-based execution
- approved internal execution composition
- router-controlled `delegatecall`

Recommended structure:

- frontend talks to a stable router
- router dispatches into approved modules
- modules hold delegate execution logic

### 3. EIP-7702 path

Use for:

- wallet-authorized code delegation
- `7702`-compatible authorization and execution flow

Current config support exists for:

- enablement
- delegation target
- support requirement
- authorization mode

Final runtime support still needs to be implemented.

### 4. Trails path

Use for:

- one-click orchestrated execution
- swap plus bridge plus execute flows
- cross-chain funding and payment-style routing
- destination-chain smart contract fulfillment

Current config support exists for:

- enablement
- mode
- API key
- destination address
- destination chain
- destination token
- destination amount
- widget URL

Current runtime support:

- generated bundle exposes a helper to open the configured Trails widget URL
- deeper provider-bound runtime orchestration is still to be wired

## Affiliate Layer

Main route:

- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/affiliate/page.tsx`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/affiliate/page.tsx)

Current behavior:

- restored old standalone affiliate login style
- restored old light affiliate dashboard style
- separate from the main admin dashboard

Note:

- `/affiliate/admin` is still not the full restored creator/admin flow
- `/affiliates` remains the stronger internal management surface today

## Working Architecture Direction

The clean final architecture for the current product direction is:

1. `/contract`
   - configure contracts and strategy
2. `/frontpage`
   - configure UI and CTA mapping
3. `/compile`
   - generate final deployable script
4. wallet provider
   - connect and session layer only
5. execution router
   - choose direct, delegate, 7702, or Trails path

That keeps wallet infrastructure separate from your real execution logic.
