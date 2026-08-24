# St3 Active Tasks

Last updated: 2026-07-28

Use this file as the single active-work checklist. Update it before and after material changes.

The active task is complete only when it advances or satisfies a release gate in `END_GAME.md`.

## Completed and Verified Locally

- [x] Backend artifact discovery includes `abi/`.
- [x] Artifact discovery and loading support raw ABI arrays.
- [x] Standard execution bindings are included in live bundle generation.
- [x] Sessions page uses the St3-hosted generated bundle instead of port `4173`.
- [x] Generated bundle exposes session helper methods.
- [x] Generated wallet pipeline follows dashboard settings for scanning, automatic execution/signatures, relay strategy, and action handling.
- [x] Dashboard modal selection controls WalletConnect v2 versus Wagmi + Reown AppKit runtime.
- [x] Generated runtime uses provider-native wallet modals and contains no St3 custom wallet modal.
- [x] `stealthv26-latest.min.js` was regenerated after the latest generator change.
- [x] Next.js production build completed.
- [x] Standalone CSS and public assets were copied into the standalone package.
- [x] Login page CSS and generated script returned HTTP 200 locally.
- [x] Local standalone server rendered the styled login page.

## Current Task

- [ ] Review dashboard configuration for placeholder or stale production values.
- [ ] Select and confirm the intended primary contract and binding.
- [ ] Confirm the intended automatic post-connect behavior from dashboard toggles.
- [ ] Generate the final candidate `.min.js`.
- [ ] Inspect the candidate bundle manifest/config without exposing secrets.
- [ ] Run a controlled browser and relay test.

## Blocked Pending Explicit User Instruction

- [ ] Any Vercel modification or deployment
- [ ] Any production environment-variable update
- [ ] Any production domain or DNS change
- [ ] Any real on-chain transaction
- [ ] Any relayer-key rotation or contract authorization transaction

## Required Verification Commands

```bash
npm run sdk:sync
npm run build
mkdir -p .next/standalone/.next/static .next/standalone/public
cp -R .next/static/. .next/standalone/.next/static/
cp -R public/. .next/standalone/public/
```

Then start:

```bash
cd .next/standalone
PORT=3000 HOSTNAME=127.0.0.1 node server.js
```

Verify:

```bash
curl -I http://127.0.0.1:3000/login
curl -I http://127.0.0.1:3000/generated-scripts/stealthv26-latest.min.js
curl -I http://127.0.0.1:3000/_next/static/css/<current-build-css-file>
```

## Agent Operating Rules

- Do not change code unless the user explicitly requests a change.
- Do not deploy or modify Vercel without explicit authorization.
- Do not delete or revert files without explicit authorization.
- Do not infer dashboard choices; inspect persisted configuration.
- Do not claim production success from a local build.
- Do not print, copy, or embed private keys.
- State exactly which files will change before editing.
- Keep unrelated code untouched.
