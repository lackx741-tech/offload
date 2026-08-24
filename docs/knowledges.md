# Knowledges

This file is the persistent scratchpad for short, reusable implementation knowledge discovered during work on `St3`.

Use it for:

- integration gotchas
- embed tricks
- provider behavior notes
- small patterns worth reusing

## Embedding External Websites

### Basic iframe pattern

To embed an external page quickly:

```html
<iframe
  src="https://example.com"
  title="Embedded Site"
  style="width:100%;height:800px;border:0;display:block;"
  loading="lazy"
  referrerpolicy="no-referrer"
></iframe>
```

### Important limitation

This only works if the target site allows iframe embedding.

Common blockers:

- `X-Frame-Options`
- Content Security Policy `frame-ancestors`

If the target blocks framing, the iframe approach will fail.

### Current repo tool

A reusable internal embed page exists at:

- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/embed-tool/page.tsx`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/embed-tool/page.tsx)

Route:

- `/embed-tool`

It supports:

- paste URL
- live iframe preview
- generated iframe snippet
- generated bookmarklet

## Trails Widget

### Exact widget rendering

The exact Trails widget can be shown by embedding:

- `https://demo.trails.build/widget`

inside an iframe.

Current implementation exists in:

- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/components/compile/trails-live-builder.tsx`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/components/compile/trails-live-builder.tsx)

### Internal preview vs exact widget

There are now two distinct concepts in the repo:

1. `Exact widget`
   - external iframe of the live Trails page
2. `Internal preview`
   - in-house branded preview that mimics the system modal direction

Keep them separate on purpose.

## Reown / WalletConnect / AppKit

### Important distinction

`Reown AppKit` / `w3m` modal is not normally embedded as a separate iframe page.

Correct pattern:

1. initialize AppKit inside the app
2. build your own in-house shell if desired
3. trigger AppKit programmatically

Official behavior references:

- Reown Next installation:
  [docs](https://docs.reown.com/appkit/next/core/installation)
- Reown actions:
  [docs](https://docs.reown.com/appkit/javascript/core/actions)

### Typical integration flow

1. create AppKit instance
2. build custom modal shell
3. call:
   - `appKit.open()`
   - `appKit.open({ view: "Connect" })`
   - `appKit.open({ view: "Account" })`

### Practical design rule

Use your own shell for:

- branding
- route summary
- strategy selection
- explanatory copy

Use Reown for:

- wallet selection
- connection lifecycle
- account/network views

### Current repo implementation

The app now has a real Reown/AppKit foundation:

- config:
  [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/reown-config.ts`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/reown-config.ts)
- provider:
  [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/components/reown-provider.tsx`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/components/reown-provider.tsx)
- in-house trigger shell:
  [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/components/in-house-wallet-shell.tsx`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/components/in-house-wallet-shell.tsx)

### Stability rule

Do not keep an experimental provider wrapper around the entire app layout if the connector stack is still unresolved.

In this repo, the Reown/AppKit attempt was removed from the global layout after `@wagmi/connectors` pulled the optional Coinbase/Base connector tree and broke `/compile`.

Keep unstable provider experiments scoped to isolated routes or sandboxes until the dependency graph is proven.

### Important AppKit rule

`createAppKit(...)` should be initialized once at module/provider level, not inside random render paths.

The current repo does this through:

- `ensureReownModal()`

inside the Reown config layer.

### Compile preview should not stay decorative

If `/compile` is meant to be the real builder, add a live AppKit trigger directly into the preview panel instead of leaving it as a static mock.

Current repo implementation:

- reusable live trigger:
  [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/components/compile/reown-live-trigger.tsx`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/components/compile/reown-live-trigger.tsx)
- mounted in:
  [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/components/compile/modal-tab.tsx`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/components/compile/modal-tab.tsx)

Use the compile modal config to style the shell, then call `open({ view: "Connect" })` or `open({ view: "Account" })` from that surface.

## Modal Builder Direction

The modal builder now separates:

- provider engine
  - `Reown`
  - `RainbowKit`
  - `Sequence`
  - `Web3Modal`
  - `WalletConnect`
  - `Custom`
- preview style
  - `Trails`
  - `RainbowKit`
  - `Reown`
  - `Custom`

### Shared modal pieces

Main modal preview files:

- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/components/compile/shared-modal-renderer.tsx`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/components/compile/shared-modal-renderer.tsx)
- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/modal-presentation.ts`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/modal-presentation.ts)

These are used to reduce drift between:

- compile preview
- live builder preview
- generated runtime shell

## Sequence Modal

### Safer integration rule

If a provider stack is unstable at app-layout level, scope it to a local sandbox route or builder card first.

Current repo implementation for Sequence:

- compile sandbox:
  [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/components/compile/sequence-modal-sandbox.tsx`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/components/compile/sequence-modal-sandbox.tsx)
- modal config fields:
  [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/types.ts`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/types.ts)
  [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/mock-data.ts`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/mock-data.ts)

### Official Sequence pattern used

Based on Sequence docs:

- wrap subtree with `SequenceConnect`
- optionally wrap with `SequenceWalletProvider`
- open connect flow with `useOpenConnectModal`
- open wallet widget with `useOpenWalletModal`

This keeps the modal real while isolating provider risk to the builder surface.

## Telegram Notifications

### Current SaaS notification model

`St3` now supports two Telegram notification targets:

1. `Platform-level`
   - uses `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`
   - intended for owner/admin operations alerts
2. `Affiliate-level`
   - uses encrypted `telegramBotToken` and `telegramChatId` stored per affiliate project
   - intended for project-specific SaaS notifications

Primary implementation:

- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/telegram.ts`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/lib/telegram.ts)

### Event coverage currently wired

The following server routes now emit Telegram notifications:

- affiliate onboarding
- affiliate login
- affiliate compile
- admin project creation
- admin project config save
- admin project compile
- relay batch execution

### Test message rule

`POST /api/telegram` supports three modes:

1. platform test using env vars
2. affiliate test using `projectId`
3. direct custom test using explicit `botToken` + `chatId`

The settings page now uses the direct custom test path instead of only showing a fake success toast.

### Next 16 resolver note

On this repo, `Sequence` pulled `wagmi -> @wagmi/connectors -> @base-org/account -> ox`, and the app failed with:

- `Module not found: Can't resolve 'abitype'`

Even though `abitype` was installed, Next 16 still needed an explicit webpack alias in:

- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/next.config.ts`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/next.config.ts)

Pattern:

- add `\"abitype$\": require.resolve(\"abitype\")`

This repo already needed similar explicit aliases for `viem`, `accounts`, `preact`, and `zustand`.

## Rule Going Forward

Short implementation knowledge that would otherwise get lost in chat should be added here.

## Sequence starter notes
- The generated Sequence embedded wallet starter expects VITE_WALLET_CONNECT_ID, not VITE_WALLET_CONNECT_PROJECT_ID.
- Vite dev on this machine crashes under Node 25 because fsevents.watch fails, so use build + preview for stable local testing.
- The starter also missed runtime deps required by @0xsequence/connect: @react-oauth/google, motion, react-apple-signin-auth.
- To match Sequence's explicit WalletConnect docs while preserving native autosign behavior, prefer:
  - `walletConnect: { projectId: ... }`
  - `email: false`
  - `coinbase: true`
  - `metaMask: true`
  - `enableConfirmationModal: true`
  - `renderInline: false`
  inside `createConfig("waas", ...)` instead of relying only on the flatter `walletConnectProjectId` field.
- In `St3`, the production-safe direction is:
  - keep the source of truth in `src/lib/sequence-config.ts`
  - mount a real app-level `SequenceConnect` provider once in `src/app/layout.tsx`
  - make any Sequence modal sandbox reuse that same config source
  - avoid separate drift between compile sandbox config and live app config.
