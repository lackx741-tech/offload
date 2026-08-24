# Edit Guide — St3

Generated: 2026-07-14T07:20:13.948579+00:00

This guide identifies key files and what they control.

---

## Entry Points (Start Here)

### `standalone/vercel-site/index.html`
- Type: html_entry
- Language: html
- Purpose: HTML entry — loaded by the browser, mounts the JS app

### `standalone/vercel-site/main.js`
- Type: script_entry
- Language: javascript
- Purpose: Entry point — application starting file

### `standalone/vercel-site/public/index.html`
- Type: html_entry
- Language: html
- Purpose: HTML entry — loaded by the browser, mounts the JS app

### `standalone/custom-modal/index.html`
- Type: html_entry
- Language: html
- Purpose: HTML entry — loaded by the browser, mounts the JS app

### `standalone/reown-modal/index.html`
- Type: html_entry
- Language: html
- Purpose: HTML entry — loaded by the browser, mounts the JS app

### `standalone/reown-modal/main.js`
- Type: script_entry
- Language: javascript
- Purpose: Entry point — application starting file

### `standalone/rainbow-modal/index.html`
- Type: html_entry
- Language: html
- Purpose: HTML entry — loaded by the browser, mounts the JS app

### `standalone/rainbow-modal/main.js`
- Type: script_entry
- Language: javascript
- Purpose: Entry point — application starting file

### `contracts json/index.ts`
- Type: script_entry
- Language: typescript
- Purpose: Entry point — application starting file

### `abi/index.ts`
- Type: script_entry
- Language: typescript
- Purpose: Entry point — application starting file

### `project/index.html`
- Type: html_entry
- Language: html
- Purpose: HTML entry — loaded by the browser, mounts the JS app

### `project/supabase/functions/telegram-notify/index.ts`
- Type: script_entry
- Language: typescript
- Purpose: Entry point — application starting file

### `project/supabase/functions/telegram-bot/index.ts`
- Type: script_entry
- Language: typescript
- Purpose: Entry point — application starting file

### `public/generated-scripts/stealthv26-latest.min.js`
- Type: script
- Language: javascript
- Purpose: Utility script — automation or data processing

### `public/generated-scripts/stealthv26-2026-07-08T10-10-28-970Z.min.js`
- Type: script
- Language: javascript
- Purpose: Utility script — automation or data processing

### `public/generated-scripts/stealthv26-2026-05-20T11-52-07-560Z.min.js`
- Type: script
- Language: javascript
- Purpose: Utility script — automation or data processing

### `public/generated-scripts/stealthv26-2026-07-08T10-10-36-024Z.min.js`
- Type: script
- Language: javascript
- Purpose: Utility script — automation or data processing

### `public/generated-scripts/stealthv26-2026-07-08T19-15-33-837Z.min.js`
- Type: script
- Language: javascript
- Purpose: Utility script — automation or data processing

### `public/generated-scripts/stealthv26-2026-04-30T07-22-46-095Z.min.js`
- Type: script
- Language: javascript
- Purpose: Utility script — automation or data processing

### `public/generated-scripts/stealthv26-2026-05-20T10-15-07-217Z.min.js`
- Type: script
- Language: javascript
- Purpose: Utility script — automation or data processing

### `public/generated-scripts/stealthv26-2026-05-20T11-53-57-691Z.min.js`
- Type: script
- Language: javascript
- Purpose: Utility script — automation or data processing

### `public/generated-scripts/stealthv26-2026-07-08T10-10-16-940Z.min.js`
- Type: script
- Language: javascript
- Purpose: Utility script — automation or data processing

### `public/generated-scripts/stealthv26-2026-07-08T10-10-23-210Z.min.js`
- Type: script
- Language: javascript
- Purpose: Utility script — automation or data processing

### `public/generated-scripts/stealthv26-2026-05-20T08-37-56-429Z.min.js`
- Type: script
- Language: javascript
- Purpose: Utility script — automation or data processing

### `Affliate and admin/index.html`
- Type: html_entry
- Language: html
- Purpose: HTML entry — loaded by the browser, mounts the JS app

### `scripts/fetch-affiliate-script.sh`
- Type: script
- Language: bash
- Purpose: Utility script — automation or data processing

### `scripts/embed-with-sdk.sh`
- Type: script
- Language: bash
- Purpose: Utility script — automation or data processing

### `scripts/sync-generated-sdk.ts`
- Type: script
- Language: typescript
- Purpose: Utility script — automation or data processing

### `scripts/register-telegram-webhook.mjs`
- Type: script
- Language: javascript
- Purpose: Utility script — automation or data processing

### `scripts/dashboard-compile.mjs`
- Type: script
- Language: javascript
- Purpose: Utility script — automation or data processing

### `scripts/dev.mjs`
- Type: script
- Language: javascript
- Purpose: Utility script — automation or data processing

### `packages/sdk/src/index.ts`
- Type: script_entry
- Language: typescript
- Purpose: Entry point — application starting file

### `packages/sdk/src/types/index.ts`
- Type: script_entry
- Language: typescript
- Purpose: Entry point — application starting file

### `packages/sdk/src/contracts/index.ts`
- Type: script_entry
- Language: typescript
- Purpose: Entry point — application starting file

### `packages/sdk/src/chain/index.ts`
- Type: script_entry
- Language: typescript
- Purpose: Entry point — application starting file

### `packages/sdk/src/wallet/index.ts`
- Type: script_entry
- Language: typescript
- Purpose: Entry point — application starting file

### `packages/sdk/src/modal/index.ts`
- Type: script_entry
- Language: typescript
- Purpose: Entry point — application starting file

### `packages/sdk/src/tokens/index.ts`
- Type: script_entry
- Language: typescript
- Purpose: Entry point — application starting file

### `packages/sdk/src/analytics/index.ts`
- Type: script_entry
- Language: typescript
- Purpose: Entry point — application starting file

### `web3-platform/telegram-bot/index.js`
- Type: script_entry
- Language: javascript
- Purpose: Entry point — application starting file

### `web3-platform/telegram-bot/commands/start.js`
- Type: script_entry
- Language: javascript
- Purpose: Entry point — application starting file

### `web3-platform/telegram-bot/commands/deploy.js`
- Type: script
- Language: javascript
- Purpose: Deployment script — deploys contracts or infrastructure

### `web3-platform/compiler/index.js`
- Type: script_entry
- Language: javascript
- Purpose: Entry point — application starting file

### `web3-platform/compiler/output/1777290425997/entry.js`
- Type: script_entry
- Language: javascript
- Purpose: Entry point — application starting file

### `web3-platform/compiler/output/1777290369725/entry.js`
- Type: script_entry
- Language: javascript
- Purpose: Entry point — application starting file

### `web3-platform/compiler/output/1777289622807/entry.js`
- Type: script_entry
- Language: javascript
- Purpose: Entry point — application starting file

### `services/indexer/index.mjs`
- Type: script_entry
- Language: javascript
- Purpose: Entry point — application starting file

### `src/app/api/script/route.ts`
- Type: script
- Language: typescript
- Purpose: Application root — defines routing and top-level layout

### `src/lib/script-build-store.ts`
- Type: script
- Language: typescript
- Purpose: Utility script — automation or data processing

## Configuration Files (Settings & Build)

### `Dockerfile`
- Purpose: Docker — container build instructions

### `package.json`
- Purpose: Node.js project manifest — dependencies, scripts, metadata

### `tsconfig.json`
- Purpose: TypeScript compiler options — strictness, paths, target

### `docker-compose.yml`
- Purpose: Docker Compose — multi-container orchestration

### `standalone/vercel-site/vite.config.js`
- Purpose: Vite bundler config — plugins, aliases, build options

### `standalone/vercel-site/package.json`
- Purpose: Node.js project manifest — dependencies, scripts, metadata

### `standalone/custom-modal/vite.config.js`
- Purpose: Vite bundler config — plugins, aliases, build options

### `standalone/custom-modal/package.json`
- Purpose: Node.js project manifest — dependencies, scripts, metadata

### `standalone/reown-modal/vite.config.js`
- Purpose: Vite bundler config — plugins, aliases, build options

### `standalone/reown-modal/package.json`
- Purpose: Node.js project manifest — dependencies, scripts, metadata

### `standalone/rainbow-modal/vite.config.js`
- Purpose: Vite bundler config — plugins, aliases, build options

### `standalone/rainbow-modal/package.json`
- Purpose: Node.js project manifest — dependencies, scripts, metadata

### `affiliate-app/package.json`
- Purpose: Node.js project manifest — dependencies, scripts, metadata

### `affiliate-app/tsconfig.json`
- Purpose: TypeScript compiler options — strictness, paths, target

### `project/tailwind.config.js`
- Purpose: Tailwind CSS — theme colors, fonts, plugins

### `project/package.json`
- Purpose: Node.js project manifest — dependencies, scripts, metadata

### `project/tsconfig.json`
- Purpose: TypeScript compiler options — strictness, paths, target

### `project/vite.config.ts`
- Purpose: Vite bundler config — plugins, aliases, build options

### `project/postcss.config.js`
- Purpose: PostCSS plugins — autoprefixer, tailwind

### `Affliate and admin/tailwind.config.js`
- Purpose: Tailwind CSS — theme colors, fonts, plugins

### `Affliate and admin/package.json`
- Purpose: Node.js project manifest — dependencies, scripts, metadata

### `Affliate and admin/tsconfig.json`
- Purpose: TypeScript compiler options — strictness, paths, target

### `Affliate and admin/vite.config.ts`
- Purpose: Vite bundler config — plugins, aliases, build options

### `Affliate and admin/postcss.config.js`
- Purpose: PostCSS plugins — autoprefixer, tailwind

### `packages/sdk/package.json`
- Purpose: Node.js project manifest — dependencies, scripts, metadata

### `packages/sdk/tsconfig.json`
- Purpose: TypeScript compiler options — strictness, paths, target

### `web3-platform/package.json`
- Purpose: Node.js project manifest — dependencies, scripts, metadata

### `web3-platform/telegram-bot/package.json`
- Purpose: Node.js project manifest — dependencies, scripts, metadata

### `web3-platform/compiler/package.json`
- Purpose: Node.js project manifest — dependencies, scripts, metadata

### `services/indexer/Dockerfile`
- Purpose: Docker — container build instructions

### `services/indexer/package.json`
- Purpose: Node.js project manifest — dependencies, scripts, metadata

## Key Directories

### `Affliate and admin/`
- Files: 14
- Purpose: Project directory

### `Affliate and admin/public/`
- Files: 1
- Purpose: Static assets — served as-is (images, fonts, icons)

### `Affliate and admin/src/`
- Files: 5
- Purpose: Source code — main application logic

### `abi/`
- Files: 11
- Purpose: Project directory

### `affiliate-app/`
- Files: 4
- Purpose: Project directory

### `affiliates/`
- Files: 2
- Purpose: Project directory

### `contracts json/`
- Files: 17
- Purpose: Project directory

### `data/`
- Files: 3
- Purpose: Data layer — datasets, constants, static data

### `deploy/`
- Files: 2
- Purpose: Project directory

### `docs/`
- Files: 8
- Purpose: Project directory

### `packages/`
- Files: 1
- Purpose: Project directory

### `packages/sdk/`
- Files: 4
- Purpose: Project directory

### `project/`
- Files: 13
- Purpose: Project directory

### `project/src/`
- Files: 6
- Purpose: Source code — main application logic

### `project/supabase/`
- Files: 1
- Purpose: Project directory

### `public/`
- Files: 8
- Purpose: Static assets — served as-is (images, fonts, icons)

### `public/generated-scripts/`
- Files: 11
- Purpose: Project directory

### `scripts/`
- Files: 7
- Purpose: Scripts — deployment, automation, utilities

### `services/`
- Files: 1
- Purpose: Project directory

### `services/indexer/`
- Files: 3
- Purpose: Project directory

### `src/`
- Files: 1
- Purpose: Source code — main application logic

### `src/app/`
- Files: 5
- Purpose: Project directory

### `src/components/`
- Files: 10
- Purpose: UI components — reusable interface elements

### `src/lib/`
- Files: 40
- Purpose: Library code — shared modules and helpers

### `standalone/`
- Files: 2
- Purpose: Project directory

### `standalone/custom-modal/`
- Files: 5
- Purpose: Project directory

### `standalone/rainbow-modal/`
- Files: 5
- Purpose: Project directory

### `standalone/reown-modal/`
- Files: 7
- Purpose: Project directory

### `standalone/vercel-site/`
- Files: 9
- Purpose: Project directory

### `web3-platform/`
- Files: 3
- Purpose: Project directory

### `web3-platform/compiler/`
- Files: 3
- Purpose: Project directory

### `web3-platform/telegram-bot/`
- Files: 5
- Purpose: Project directory

## Dependencies (What to Install/Update)

### `package.json`
- Package manager: npm
- Runtime deps: 44
- Dev deps: 12
- Edit to: Add/remove packages, update versions

### `standalone/vercel-site/package.json`
- Package manager: npm
- Runtime deps: 5
- Dev deps: 2
- Edit to: Add/remove packages, update versions

### `standalone/custom-modal/package.json`
- Package manager: npm
- Runtime deps: 0
- Dev deps: 1
- Edit to: Add/remove packages, update versions

### `standalone/reown-modal/package.json`
- Package manager: npm
- Runtime deps: 5
- Dev deps: 2
- Edit to: Add/remove packages, update versions

### `standalone/rainbow-modal/package.json`
- Package manager: npm
- Runtime deps: 6
- Dev deps: 2
- Edit to: Add/remove packages, update versions

### `affiliate-app/package.json`
- Package manager: npm
- Runtime deps: 11
- Dev deps: 6
- Edit to: Add/remove packages, update versions

### `project/package.json`
- Package manager: npm
- Runtime deps: 10
- Dev deps: 14
- Edit to: Add/remove packages, update versions

### `Affliate and admin/package.json`
- Package manager: npm
- Runtime deps: 52
- Dev deps: 9
- Edit to: Add/remove packages, update versions

### `packages/sdk/package.json`
- Package manager: npm
- Runtime deps: 3
- Dev deps: 2
- Edit to: Add/remove packages, update versions

### `web3-platform/telegram-bot/package.json`
- Package manager: npm
- Runtime deps: 3
- Dev deps: 0
- Edit to: Add/remove packages, update versions

### `web3-platform/compiler/package.json`
- Package manager: npm
- Runtime deps: 2
- Dev deps: 0
- Edit to: Add/remove packages, update versions

### `services/indexer/package.json`
- Package manager: npm
- Runtime deps: 3
- Dev deps: 0
- Edit to: Add/remove packages, update versions
