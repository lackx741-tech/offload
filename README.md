# St3

`St3` is a web3 operational dashboard, contract/frontpage builder, and script compiler.

## Documentation

Start here:

- [Project Overview](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/docs/project-overview.md)
- [Complete Build Guide](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/docs/BUILD_GUIDE.md)
- [Architecture](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/docs/architecture.md)
- [Contract Backends](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/docs/contract-backends.md)
- [Railway Deployment Recommendation](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/docs/railway-deployment.md)
- [Production Deployment](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/docs/PRODUCTION_DEPLOYMENT.md)
- [Implementation Log](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/docs/implementation-log.md)
- [Documentation Process](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/docs/process.md)
- [Knowledges](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/docs/knowledges.md)

## Current Project Details

The active app is the root Next.js project in this folder. Its current production-focused scope is:

- dedicated admin login at `/login`
- contract and ABI loading from `contracts json/`
- shared operational config across `/contract`, `/compile`, and runtime pages
- Reown / WalletConnect integration for EVM flows
- Telegram bot webhook support for admin and project operations
- generated script compilation and publishing from the main app

The currently implemented execution backends are:

- `stealth-exchange`
- `permit2-executor`
- `erc2612-executor`
- `batch-multicall`

The current default testing contract is:

- `StealthExchange`
- `0x788F5098C58BF5854ebf2b10B0D9303b13ABF43A`

Deployment target:

- Railway for the web app
- Redis for shared state and sessions
- local file-backed build/config storage unless moved to persistent volumes or a database

Older project notes still present in the repo:

- [projectsummary.md](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/projectsummary.md)
- [BUILD_STATUS.md](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/BUILD_STATUS.md)
- [Integration.md](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/Integration.md)

Do not add new root-level project notes. Keep ongoing documentation in `docs/` and treat the older loose `.md` files as legacy reference only.

## Getting Started

This is a Next.js app. Run:

```bash
npm run dev
```

The dev script auto-picks a free port starting from `3000`.

## Deployment Recommendation

For the current architecture, Railway is the recommended default backend platform because it provides:

- a stable public HTTPS URL for the Telegram webhook
- private networking between app, Redis, and future workers
- straightforward service deployment for the Next.js app

Read [Railway Deployment Recommendation](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/docs/railway-deployment.md) before deploying.
