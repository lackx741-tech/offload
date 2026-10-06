# Source classification

## Current primary application source

The root `package.json` scripts run the Next app, TypeScript workers and selected CLI utilities (`package.json:8–24`). Next route modules are current app source; queue producers/workers, persistence stores, registries and generator modules imported in their live request/worker paths are `ACTIVE`. The exact primary Next source hierarchy is inventoried in `REPOSITORY_TREE.md`.

## Optional and disconnected paths

- `OPTIONAL`: active route/method or ecosystem/feature branch exists, but is selected only by request, environment configuration, or UI state. Examples are queue-backed compile mode and `/api/script/generate-drainer`.
- `DISCONNECTED`: implementation exists without a proven call site from the primary runtime, such as `enqueueRelayJob()` and `enqueueTelegramOutbound()`.
- `UNKNOWN`: separate projects and files whose independent execution/deployment cannot be proven from root runtime source. Root `packages/sdk/`, `project/`, `standalone/`, `web3-platform/`, `affiliate-app/`, `Affliate and admin/`, `vercel-demo/`, and `affiliates/` fit here absent their separate run context.

## Legacy but reachable

`src/components/affiliate/legacy-*` are imported by `src/components/affiliate/affiliate-portal.tsx`; the legacy panel imports its subcomponents. They have runtime references and therefore are not classified as dead. `legacy-types.ts` is imported by those components. The `legacy-` name is not used as sole evidence of disconnection.

## Snapshots/backups

These are file snapshots and are not Next route modules or imports discovered by primary runtime search:

- `src/app/api/compile/route.ts.save`
- `src/app/api/compile/route.ts.st3.bak`
- `src/components/compile/compile-output.tsx.st3.bak`
- `src/components/compile/contract-tab.tsx.save`
- `src/lib/contract-registry.ts.save`
- `src/lib/contract-registry.ts.st3.bak`
- `src/lib/sdk-generator.ts.bak`
- `src/lib/standard-function-bindings.ts.st3.bak`
- `src/lib/types.ts.st3.bak`
- `data/compile-config.json.bak.1787837305`

Classification: `SNAPSHOT/BACKUP`. No runtime references were found.

## Tests

`test/*.test.ts` are Vitest tests, and `test/setup.ts` is test setup. `package.json:9–12` defines test scripts; `vitest.config.mts` configures Vitest. These are `TEST`, not runtime application consumers.

## Artifacts and checked-in outputs

- `public/generated-scripts/*.min.js`: generated script output served as public static assets, not source generator implementations.
- `.builds/build-*.js`: local generated output files; output data, not TypeScript source.
- `contracts json/*.json`, `abi/*.json`: static ABI/artifact data. Some are direct registry imports; others are dynamically discoverable or unproven (see `CONTRACT_ABI_FLOW.md`).
- `data/*.json`: config/state examples or data files; only stores with proven readers/writers are classified as active persistence. `data/script-builds.json` is not the active `.builds` directory index based on current store code.
- Root architecture Markdown/HTML reports are documentation, not evidence that a described component is active. Use actual source references for runtime status.

## No broad “dead code” conclusion

No file is marked dead solely because it is old, named legacy, or lacks a direct import. Next route handlers may be invoked externally, and secondary project roots may have independent deployment. `DISCONNECTED_IMPLEMENTATIONS.md` records only the narrower proven in-repository reference result.
