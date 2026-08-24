# Contract Backends

This document defines the execution-capable contracts currently modeled by `St3`, what each one is for, and which frontend/backend flows are actually implemented.

## Summary

The codebase now treats contracts as explicit execution backends instead of one generic "executor" bucket.

The canonical registry lives in:

- [src/lib/contract-registry.ts](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/contract-registry.ts)

The active execution backend is stored in:

- `strategy.executionBackend`
- types in [src/lib/types.ts](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/types.ts)
- defaults in [src/lib/mock-data.ts](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/mock-data.ts)

## Backends

### `stealth-exchange`

Role:
- Primary Permit2 typed-sign executor
- Current gasless batch backend

Main contract:
- `StealthExchange`

Current implemented flow:
- WalletConnect/Reown connect
- scan balances and Permit2 allowances
- optional Permit2 approvals
- EIP-712 `PermitBatch` signature
- relay to `/api/relay/batch`
- contract call: `batchPermitTransferFromBatch(...)`

Relevant files:
- [src/app/permit2/page.tsx](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/permit2/page.tsx)
- [src/app/api/relay/batch/route.ts](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/api/relay/batch/route.ts)

### `permit2-executor`

Role:
- Permit2 allowance-pull executor

Main contract:
- `Permit2Executor`

Current implemented flow:
- WalletConnect/Reown connect
- scan balances and Permit2 allowances
- optional Permit2 approvals
- relay to `/api/relay/batch`
- contract call: `pullBatchFromAllowance(client, tokens, amounts)`

Important:
- this path currently uses existing Permit2 allowances
- it does not yet implement the custom signed `collectBatch(...)` flow because the repo does not clearly document that EIP-712 schema

### `erc2612-executor`

Role:
- ERC-2612 permit executor

Main contract:
- `ERC2612Executor`

Current implemented flow:
- WalletConnect/Reown connect
- scan balances and probe standard ERC-2612 support per token
- only tokens exposing standard `nonces(owner)` are treated as permit-capable
- sign standard EIP-2612 `Permit` typed data per selected token
- relay to `/api/relay/batch`
- contract call: `batchPermitAndCollect(...)`

Important:
- this only works for tokens that implement standard ERC-2612 semantics
- non-standard permit variants are not treated as supported
- direct non-relay execution is still not implemented on `/permit2`

### `batch-multicall`

Role:
- generic calldata batch executor

Main contract:
- `BatchMulticall`

Current implemented flow:
- WalletConnect/Reown connect
- scan token balances
- check standard ERC-20 allowances against the `BatchMulticall` contract
- approve selected tokens to the multicall contract if needed
- relay to `/api/relay/batch`
- contract call: `batch(...)` with encoded `transferFrom(user, recipient, amount)` calls

Important:
- this path does not use Permit2 signatures
- it depends on normal ERC-20 approvals to the multicall contract
- direct non-relay execution is still not implemented on `/permit2`

### `eip7702-delegate`

Role:
- EIP-7702 delegated execution backend

Main contract:
- `EIP7702BatchDelegate`

Supporting module:
- `EIP7702Module`

Status:
- modeled in registry
- selectable in operational config UI
- not yet wired into a runnable execution path

Expected future direction:
- delegated token/call bundles
- wallet capability detection required

### `orch`

Role:
- orchestrated execution backend

Main contract:
- `AttackerOrchestrator`

Status:
- modeled in registry
- selectable in operational config UI
- not yet wired into a runnable UI flow

## Supporting Contracts

### `StealthExchangeFactory`

Role:
- factory and deployment tracking

### `Stage1Module`, `Stage2Module`

Role:
- account module / wallet execution layer

### `SessionManager`

Role:
- session permission validation

## Compatibility Rules

These contracts are not interchangeable. They accept different payload shapes.

Today:
- `stealth-exchange` is compatible with the current EIP-712 Permit2 batch payload
- `permit2-executor` is compatible with the current allowance-pull batch payload
- `erc2612-executor` is compatible with standard ERC-2612 permit signing for supported tokens
- `batch-multicall` is compatible with the current token-selection flow after standard ERC-20 approvals

Not currently compatible with the shared `/api/relay/batch` payload:
- `eip7702-delegate`
- `orch`

## Current UI / API Surface

Contract metadata and capabilities are exposed from:

- [src/app/api/config/route.ts](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/api/config/route.ts)
- [src/app/api/contracts/[id]/route.ts](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/api/contracts/[id]/route.ts)

The execution backend selector is currently saved from:

- [src/app/contract/page.tsx](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/contract/page.tsx)

The `permit2` execution page currently honors:

- `stealth-exchange`
- `permit2-executor`
- `erc2612-executor`
- `batch-multicall`

## Recommended Next Steps

1. Add a visible backend selector to `/permit2` instead of only honoring operational config.
2. Implement wallet-capability-aware `eip7702-delegate` as the next real backend.
3. Only implement `Permit2Executor.collectBatch(...)` after the exact typed-sign schema is confirmed from source or spec.
