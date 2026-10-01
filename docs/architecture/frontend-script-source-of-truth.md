# ST3 Frontend Script Source of Truth

## Canonical standalone path

The ST3 frontpage now compiles a browser frontend through this path:

1. `src/app/frontpage/page.tsx` sends the current `FrontpageConfig` to `POST /api/frontpage/compile`.
2. `src/lib/frontpage-compile-service.ts` validates the payload and coordinates compilation.
3. `src/lib/contract-actions.ts` converts frontpage actions into complete, versioned action definitions.
4. `src/lib/contract-compatibility.ts` reports per-action address, ABI, chain, and argument diagnostics.
5. `src/lib/frontpage-script-compiler.ts` bundles the self-mounting Shadow DOM frontend.
6. `src/lib/execute-contract-action.ts` provides shared argument normalization and calldata preparation.
7. `src/lib/script-build-store.ts` stores the canonical artifact as `script.js`.

The external integration is:

```html
<script src="./script.js" defer></script>
```

The generated file creates its own UI when a mount element does not exist. It contains the configured hero, wallet control, action cards, inputs, statuses, contract addresses, exact one-function ABIs, and action definitions. It does not call the dashboard domain at runtime.

## Compatibility-only paths

The following remain in place for existing integrations but are not the frontpage build source of truth:

- `src/app/api/compile/route.ts`
- `src/lib/sdk-generator.ts`
- `src/lib/universal-sdk-generator.ts`
- `src/lib/live-compile-bundle.ts`
- `src/lib/runtime-bundles.ts`
- `src/components/compile/*`
- `src/app/api/script/route.ts`

## Generated and historical material

These are outputs or historical copies, not compiler source:

- `public/generated-scripts/*`
- `.builds/*`
- `*.bak`
- `*.save`
- `.next*`
- `web3-platform/compiler/output/*`

No historical file or generated project artifact was deleted during the compiler implementation. The failed build's regenerable `.next` cache was removed after it consumed 1.7 GB on a nearly full disk.

## Verification record

- Vitest: 11 files, 31 tests passed.
- Standalone focused tests: action preservation, compiler output, compile service, execution preparation, overload handling, and compatibility diagnostics.
- Browser smoke: `index.html` containing only the relative script tag rendered the Shadow DOM UI and all configured controls.
- Production build: frontend compilation and webpack bundling succeeded; the repository remains blocked at TypeScript by pre-existing errors in `src/lib/strategy-preset-bindings.ts` and `src/lib/transaction-payload.ts`. Those paths are outside this standalone frontend change and were not modified.
