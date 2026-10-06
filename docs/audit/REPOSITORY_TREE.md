# Repository tree (meaningful runtime and source hierarchy)

This inventory is based on the checked-out repository. Generated bundles are listed as a directory rather than reproduced. `.git`, dependency trees, compressed archives, and build caches are excluded; they are not maintained source hierarchies. `[UNKNOWN]` means no runtime role is established by an in-repository caller.

```text
.
├── src/                                      [ENTRY]
│   ├── middleware.ts                         [ENTRY]
│   ├── abi/drainer-abis.ts                   [CONTRACT]
│   ├── app/
│   │   ├── layout.tsx                        [ENTRY]
│   │   ├── page.tsx                          [UI]
│   │   ├── globals.css
│   │   ├── admin-settings/page.tsx           [UI]
│   │   ├── affiliate/{page.tsx,admin/page.tsx}[UI]
│   │   ├── affiliates/page.tsx               [UI]
│   │   ├── analytics/page.tsx                [UI]
│   │   ├── compile/page.tsx                  [UI][COMPILER]
│   │   ├── contract/page.tsx                 [UI][CONTRACT]
│   │   ├── contracts-import/page.tsx         [UI][CONTRACT]
│   │   ├── demo/page.tsx                     [UI]
│   │   ├── dex-test/page.tsx                 [UI]
│   │   ├── domains/page.tsx                  [UI]
│   │   ├── embed-tool/page.tsx               [UI]
│   │   ├── frontpage/{page.tsx,runtime/page.tsx}[UI][RUNTIME]
│   │   ├── login/page.tsx                    [UI]
│   │   ├── logs/page.tsx                     [UI]
│   │   ├── permit2/page.tsx                  [UI][CONTRACT]
│   │   ├── queues/page.tsx                   [UI][QUEUE]
│   │   ├── sdk-self-test/page.tsx             [UI]
│   │   ├── sessions/page.tsx                 [UI]
│   │   ├── settings/page.tsx                 [UI]
│   │   ├── strategy/page.tsx                 [UI]
│   │   ├── templates/page.tsx                [UI][TEMPLATE]
│   │   ├── wallet-runtime/page.tsx            [UI][RUNTIME]
│   │   ├── wallet-test/page.tsx              [UI]
│   │   └── api/                              [API]
│   │       ├── action/execute/route.ts
│   │       ├── admin/access/route.ts
│   │       ├── affiliate/{access,compile,config,onboard}/route.ts
│   │       ├── analytics/route.ts
│   │       ├── auth/{logout,me,nonce,verify}/route.ts
│   │       ├── compile/route.ts               [COMPILER]
│   │       ├── compile/status/[jobId]/route.ts[QUEUE]
│   │       ├── {compile-config,compile-test,config}/route.ts
│   │       ├── contracts/{route.ts,[id]/route.ts,import/route.ts}[CONTRACT]
│   │       ├── domains/route.ts
│   │       ├── frontpage/compile/route.ts     [COMPILER]
│   │       ├── health/route.ts
│   │       ├── indexer/route.ts
│   │       ├── logs/route.ts
│   │       ├── notify/route.ts                [QUEUE][TELEGRAM]
│   │       ├── {operational-config,platform-config,settings}/route.ts
│   │       ├── projects/route.ts
│   │       ├── projects/[id]/{route.ts,compile/route.ts,config/route.ts,
│   │       │   reset-password/route.ts,stats/route.ts}
│   │       ├── queues/route.ts                 [QUEUE]
│   │       ├── relay/{batch,status}/route.ts
│   │       ├── script/{route.ts,generate-drainer/route.ts}[GENERATOR]
│   │       ├── sdk/route.ts                    [GENERATOR]
│   │       ├── submit-drainer/route.ts
│   │       ├── telegram/route.ts
│   │       ├── telegram/webhook/route.ts       [TELEGRAM][QUEUE]
│   │       ├── telegram/affiliate/[token]/route.ts[TELEGRAM]
│   │       └── tx-payload/route.ts
│   ├── components/
│   │   ├── affiliate/{affiliate-access-hub,affiliate-compile-output,
│   │   │   affiliate-portal}.tsx
│   │   ├── affiliate/legacy-*.tsx              [LEGACY]
│   │   ├── compile/{advanced-tab,compile-output,contract-tab,general-tab,
│   │   │   modal-tab,payout-tab,reown-live-trigger,shared-modal-renderer,
│   │   │   tokens-tab,trails-live-builder,wallet-tab,web3-rewards-tab}.tsx
│   │   ├── frontpage/action-embed.tsx
│   │   ├── ui/*.tsx                            [UI]
│   │   └── {header,in-house-wallet-shell,layout-wrapper,reown-provider,
│   │       sidebar,store-hydration,theme-provider,wallet-provider}.tsx
│   └── lib/
│       ├── control-plane/{abi-compiler,project-manifest,value-codec}.ts
│       ├── queues/{compile,index,notify,relay,telegram}.ts[QUEUE]
│       ├── schemas/sdk-config.schema.ts
│       ├── {affiliate-compile,compile-config-store,contract-registry,
│       │   frontpage-compile-service,frontpage-config-store,frontpage-script-compiler,
│       │   live-compile-bundle,operational-config-store,projects,script-build-store,
│       │   sdk-generator,telegram-bot,transaction-payload,universal-sdk-generator,
│       │   web3-rewards-script-generator}.ts
│       ├── runtime-bundles.ts                  [GENERATOR]
│       ├── drainer-script-generator.ts         [GENERATOR]
│       ├── drainer-widget-runtime.js           [RUNTIME]
│       └── remaining lib/*.ts (auth, Redis/Kafka,
│           strategy, wallet, validation, configuration, helpers)
├── abi/                                        [CONTRACT]
│   ├── index.ts
│   └── *.json (20 ABI artifacts)
├── contracts json/                             [CONTRACT]
│   ├── index.ts, index.json, README.md
│   └── *.json (contract/artifact JSON; inventory in CONTRACT_ABI_FLOW.md)
├── workers/                                    [WORKER][QUEUE]
│   ├── {run-all,env}.ts
│   ├── {compile,notify,relay,telegram}.worker.ts
├── scripts/                                    [ENTRY]
│   ├── dev.mjs
│   ├── dashboard-compile.mjs                  [COMPILER]
│   ├── sync-generated-sdk.ts                  [GENERATOR][OUTPUT]
│   ├── register-telegram-webhook.mjs           [TELEGRAM]
│   ├── embed-template.html
│   ├── embed-with-sdk.sh
│   └── fetch-affiliate-script.sh
├── data/                                       [CONFIG][STORE]
│   ├── compile-config.json
│   ├── operational-config.json
│   ├── script-builds.json
│   └── compile-config.json.bak.*               [BACKUP]
├── .builds/                                    [OUTPUT]
│   └── build-*.js (runtime-generated local builds)
├── public/
│   ├── generated-scripts/*.min.js              [OUTPUT][RUNTIME]
│   └── website assets and EMBED_GUIDE.md
├── test/*.test.ts                              [TEST]
├── packages/sdk/src/{analytics,chain,contracts,core,modal,tokens,types,wallet} [UNKNOWN]
├── services/indexer/{index.mjs,Dockerfile,package.json}[ENTRY]
├── docker-compose*.yml, Dockerfile, next.config.ts[CONFIG][ENTRY]
├── deploy/{nginx.conf,setup.sh,workers/...}     [CONFIG][ENTRY]
├── standalone/{custom-modal,rainbow-modal,reown-modal,vercel-site,wallet-connect.html}[UNKNOWN]
├── affiliate-app/                              [UNKNOWN]
├── affiliates/{config-panel.tsx,script-generator.tsx}[UNKNOWN]
├── project/                                    [UNKNOWN]
│   ├── src/ (separate Vite/React project)
│   └── supabase/{functions,migrations}/
├── web3-platform/{compiler,telegram-bot}/       [UNKNOWN]
├── vercel-demo/                                [UNKNOWN]
├── test-dapp-site/                              [TEST/UNKNOWN]
├── Affliate and admin/                          [UNKNOWN]
├── docs/ (architecture, deploy, plans, specs)
└── root documentation, lockfiles, config files, and archived artifacts
```

## Classification notes

- `src/app/**/page.tsx` and `src/app/api/**/route.ts` are Next App Router entrypoints; reachability of a route does not prove every UI consumer.
- `src/lib` contains actively imported runtime services as well as modules with no discovered production caller. Detailed call-site status is in `DISCONNECTED_IMPLEMENTATIONS.md` and `FILE_RELATIONSHIPS.md`.
- Root directories other than the primary `src/` Next app include multiple separately packaged projects and archived/example output. Their existence is not evidence they are started by the root Next app.
- Snapshot files under `src/`: `src/app/api/compile/route.ts.save`, `src/app/api/compile/route.ts.st3.bak`, `src/components/compile/{compile-output.tsx.st3.bak,contract-tab.tsx.save}`, and `src/lib/{contract-registry.ts.save,contract-registry.ts.st3.bak,sdk-generator.ts.bak,standard-function-bindings.ts.st3.bak,types.ts.st3.bak}`.
