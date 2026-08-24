# St3 Verified Decisions

Last updated: 2026-07-28

This log records decisions that must not be silently reinterpreted. Add new entries; do not rewrite history without explaining why.

## D-000 — End Game Governs Completion

Status: accepted

`END_GAME.md` defines the final outcome, release gates, definition of done, stop conditions, and required handoff. Work is not complete merely because it builds locally.

## D-001 — Dashboard Is the Control Plane

Status: accepted

Wallet behavior, ABI selection, contract bindings, strategy, relay behavior, payout, and compilation are controlled from the dashboard and persisted configuration. The generator must not replace dashboard choices with hardcoded behavior.

## D-002 — Website Uses a Hosted Generated Bundle

Status: accepted

Customer websites load:

```text
/generated-scripts/stealthv26-latest.min.js
```

The stable alias points to the latest compiled build. Timestamped builds are retained for version history.

## D-003 — Normal Standalone Wallet Button

Status: accepted

The website surface is a normal standalone wallet button. The appearance of the button does not remove configured backend capabilities. Scanning, signing, relay use, and execution follow dashboard settings.

## D-004 — Relay Remains Server-Side

Status: accepted

The generated browser script may contain a public relay URL. The relayer private key remains server-only. Contract authorization and gas funding are operational prerequisites.

## D-005 — Sessions Are Hosted by St3

Status: accepted

The Sessions page uses the St3-hosted generated runtime. It does not depend on a separate visitor-local `http://localhost:4173` iframe.

## D-006 — ABI Discovery Supports Existing Formats

Status: accepted

The backend scans `abi/` and supports raw ABI arrays as well as artifact objects with an `abi` field. Existing ABI files are preserved.

## D-007 — No Unrequested Remote Changes

Status: accepted

Local work does not authorize Vercel deployment, environment changes, DNS changes, or other remote mutations. These require explicit user instruction.

## D-008 — No Unrequested Code Changes

Status: accepted

Diagnosis and explanation do not authorize implementation. Before material edits, state the intended files and scope. Preserve unrelated files and behavior.

## D-009 — Standalone Assets Must Be Packaged

Status: accepted

Next.js standalone output does not automatically serve project-root `.next/static` and `public`. Both must be copied into `.next/standalone` for production packaging. A styled local page and HTTP 200 asset checks are required before declaring the package valid.

## D-010 — Verification Over Assumption

Status: accepted

For every claim, identify whether it is:

- verified in source
- verified in persisted configuration
- verified by local build
- verified by browser/HTTP test
- verified on-chain
- verified in production

Do not promote one verification level to another.

## D-011 — Wallet Engine Is Selected at Compile Time

Status: accepted

The existing dashboard modal-framework selection controls the generated wallet runtime:

- `walletconnect` uses WalletConnect v2 `EthereumProvider` and its native QR modal.
- `reown` and the Wagmi/AppKit-compatible selections use `WagmiAdapter` with Reown AppKit's native modal and `<appkit-button>`.

St3 must not render a separate custom wallet-selection modal.
