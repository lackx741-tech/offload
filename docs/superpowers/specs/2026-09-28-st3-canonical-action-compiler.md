# ST3 Standalone Frontend Script Compiler Specification

## Goal

Compile an ST3 frontpage configuration into one standalone browser `script.js` that renders its own inline UI and runs the configured contract actions. The generated artifact is not an SDK and does not depend on the ST3 dashboard domain at runtime.

## Output contract

The host website needs only `<script src="./script.js" defer></script>`.

When loaded, `script.js` creates an isolated frontend containing the configured hero, action cards, argument inputs, wallet controls, transaction status, and result display. It may mount into a configured selector or create its own root when no host element exists.

## Scope

- Preserve the current ST3 builder and existing artifacts.
- Introduce one versioned canonical EVM action model.
- Preserve address, complete function ABI, arguments, native value, labels, and chain ID.
- Generate inline HTML and CSS from the frontpage configuration.
- Generate wallet connection and contract read/simulate/write behavior inside the script.
- Use Shadow DOM for style isolation.
- Produce a deterministic `script.js` artifact and download response.
- Add compatibility diagnostics and browser smoke tests.

## Non-goals for this phase

- Calling `generateSDKBundle` or exposing an SDK-oriented output.
- Requiring React, Next.js, or the ST3 domain on the client website.
- Deleting legacy files or generated artifacts.
- Implementing Solana or Tron execution adapters.
- Changing deployed contracts.

## Acceptance criteria

1. The exact configured frontpage actions survive compilation.
2. The output contains the configured UI copy and action controls.
3. Loading the output on a blank page renders the complete UI.
4. The output can attach to an existing page without leaking styles.
5. Overloaded functions resolve by full ABI signature.
6. Tuple, array, integer, boolean, bytes, and address arguments are preserved and validated.
7. The generated script exposes lifecycle events and visible transaction states.
8. The browser artifact contains no dependency on the ST3 dashboard hostname.
9. Existing files and current uncommitted work are preserved.
