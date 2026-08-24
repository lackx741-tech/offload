# St3 Plans

Last updated: 2026-07-28

This file contains future work only. Current verified state belongs in `Architecture.md`; active work belongs in `Task.md`.

All plans must move St3 toward the release gates in `END_GAME.md`.

## P0 — Production Readiness

- [ ] Replace every stale development value in persisted compile configuration.
- [ ] Confirm the real WalletConnect/Reown project ID is embedded in the generated bundle.
- [ ] Confirm the generated relay URL is the production `/api/relay/batch` endpoint.
- [ ] Rotate any relayer credential that has appeared in terminal or chat output.
- [ ] Confirm the new relayer address is funded on every enabled chain.
- [ ] Confirm each selected execution contract authorizes the relayer address.
- [ ] Validate CORS or same-origin proxying for the production website-to-relay request.
- [ ] Test the complete flow with a dedicated test wallet and limited funds.
- [ ] Verify production domains without changing Vercel unless deployment is explicitly authorized.

## P1 — Dashboard and Compiler

- [ ] Make all generated-runtime behavior visibly traceable to a named dashboard control.
- [ ] Add a compile summary showing:
  - selected contract and address
  - selected binding
  - strategy/backend
  - relay URL
  - enabled chains
  - automatic post-connect behavior
- [ ] Block production compilation when required values are placeholders.
- [ ] Add schema validation for every persisted binding.
- [ ] Add a one-click “Build standalone package” command that copies static/public assets.
- [ ] Add a generated-bundle manifest containing version and non-secret configuration.

## P1 — Wallet and Sessions

- [ ] Test wallet connect, disconnect, and reconnection for each enabled provider.
- [ ] Persist active session metadata only when dashboard session caching is enabled.
- [ ] Verify SessionManager ABI functions against the deployed contract.
- [ ] Separate session authorization, session execution, and session history in the UI.
- [ ] Add clear transaction previews before explicit action-button execution.

## P1 — Contracts and Relay

- [ ] On-chain verify every configured contract address and chain.
- [ ] Verify standard bindings against their exact deployed bytecode/ABI.
- [ ] Add relay health diagnostics for:
  - key configured
  - relayer address
  - gas balance
  - RPC connectivity
  - contract authorization
- [ ] Add per-backend integration tests for Permit2, ERC-2612, multicall, sessions, and EIP-7702.
- [ ] Add transaction-status persistence and user-facing failure reasons.

## P2 — Operations

- [ ] Reconcile or archive stale documentation under `docs/`.
- [ ] Add CI gates for type checking, build, and bundle verification.
- [ ] Add versioned deployment records.
- [ ] Document rollback procedures for the app and generated script.
- [ ] Review npm audit findings without applying forced breaking upgrades.

## Definition of Production Ready

Production is ready only when:

- the dashboard configuration contains no placeholders
- the generated script references the intended production domains
- the standalone app serves CSS, JavaScript, and public assets successfully
- the relay passes health and authorization checks
- an approved end-to-end test succeeds on the intended chain
- the exact generated version and deployment are recorded in `DECISIONS.md`
