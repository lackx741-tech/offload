# ST3 Standalone Frontend Script Compiler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a standalone `script.js` that renders the configured ST3 frontend inline and executes its exact contract actions.

**Architecture:** Convert frontpage configuration into canonical actions, then compile a self-mounting browser runtime with isolated HTML/CSS, wallet handling, action inputs, and transaction status. This compiler is independent of the existing SDK generators.

**Tech Stack:** TypeScript, Next.js 16 route handlers, viem, esbuild, Vitest, browser smoke tests.

**Spec:** `docs/superpowers/specs/2026-09-28-st3-canonical-action-compiler.md`

## Global Constraints

- Do not call the existing SDK generators from the new frontpage build path.
- Preserve all existing artifacts and current uncommitted user changes.
- Delete nothing during this phase.
- Use test-first red/green cycles.
- The output filename is `script.js` and the host integration is one script tag.
- The generated runtime must not require the dashboard domain.

## Review Focus

- Address, ABI, arguments, native value, chain ID, and UI copy survive compilation.
- Overloaded functions and tuple components remain unambiguous.
- Generated styles remain isolated from the host page.
- A missing mount target falls back to a self-created root.
- Invalid actions produce visible diagnostics instead of disappearing.

---

### Task 1: Canonical frontend action model

**Files:** Create `src/lib/contract-actions.ts`; modify `src/lib/frontpage-compile-sync.ts`; test `test/contract-actions.test.ts`.

- [ ] Write failing tests proving every contract and UI field survives conversion.
- [ ] Implement `CompiledContractActionV1` and pure frontpage conversion.
- [ ] Run focused and complete tests.

### Task 2: Standalone frontend script compiler

**Files:** Create `src/lib/frontpage-script-compiler.ts`; test `test/frontpage-script-compiler.test.ts`.

- [ ] Write failing tests for inline UI, Shadow DOM, action registry, wallet controls, statuses, and absence of the ST3 hostname.
- [ ] Generate one self-mounting browser entry from canonical configuration.
- [ ] Bundle it as an IIFE named `script.js` without React or Next.js runtime dependencies.
- [ ] Run focused and complete tests.

### Task 3: Dedicated frontpage build API

**Files:** Create `src/app/api/frontpage/compile/route.ts`; modify `src/app/frontpage/page.tsx`; test `test/frontpage-compile-route.test.ts`.

- [ ] Write failing route tests proving this path never calls an SDK generator.
- [ ] Compile, save, and return `script.js` plus a one-line script-tag snippet.
- [ ] Make the ST3 frontpage Compile button use the dedicated route.
- [ ] Run focused and complete tests.

### Task 4: Shared action execution semantics

**Files:** Create `src/lib/execute-contract-action.ts`; modify `src/components/frontpage/action-embed.tsx`; test `test/execute-contract-action.test.ts`.

- [ ] Write failing tests for argument normalization, overloads, native value, read, simulate, and write preparation.
- [ ] Use the same canonical action semantics in preview and generated frontend.
- [ ] Run focused and complete tests.

### Task 5: Compatibility diagnostics

**Files:** Create `src/lib/contract-compatibility.ts`; test `test/contract-compatibility.test.ts`; integrate into the frontpage compile route.

- [ ] Write failing tests for missing address, missing ABI function, invalid arguments, and valid actions.
- [ ] Return structured per-action diagnostics without dropping configurations.
- [ ] Run focused and complete tests.

### Task 6: Verification and source-of-truth inventory

**Files:** Create `docs/architecture/frontend-script-source-of-truth.md`; repair the existing compile test harness without changing unrelated behavior.

- [ ] Document the dedicated frontend compiler as the canonical ST3 frontpage build path.
- [ ] Inventory old SDK/compiler files as active, compatibility-only, generated, or archive candidates.
- [ ] Run the complete Vitest suite and record exact results.
- [ ] Run the production Next.js build and record exact results.
- [ ] Load the generated `script.js` in a blank browser fixture and verify rendered UI.
- [ ] Delete nothing until the inventory is reviewed.
