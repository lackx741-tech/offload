# Documentation Process

## Purpose

The repo has accumulated multiple implementation tracks over time:

- builder and compile foundation
- contract and ABI import work
- affiliate/admin work
- operational config work
- strategy expansion toward `delegatecall` and `EIP-7702`

This process keeps future changes structured and reviewable.

## Standard Format For Future Changes

Every meaningful feature change should be documented with these five sections.

### 1. Goal

State what the feature or fix is meant to achieve.

Example:

- add provider-backed `7702` execution
- restore old affiliate admin page
- wire hosted modal runtime to Sequence

### 2. Current State

List:

- what already exists
- what is missing
- what constraints or blockers exist

### 3. Implementation Steps

Document work step by step.

Each step should include:

- file paths
- route or API affected
- actual behavior change

### 4. Verification

Document:

- lint status
- build status
- manual route testing
- any known remaining issues

### 5. Next Step

End with the single best next action.

This prevents drift and keeps the roadmap practical.

## Recommended Document Files

Use these files:

- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/docs/project-overview.md`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/docs/project-overview.md)
- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/docs/architecture.md`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/docs/architecture.md)
- [`/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/docs/implementation-log.md`](/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/docs/implementation-log.md)

Do not add new ad hoc root-level `.md` status files for ongoing work. Keep active documentation inside `docs/`, and treat older loose notes in the repo root as legacy reference only.

## Operating Rule

Do not treat chat messages as the only source of truth.

Whenever a structural feature is added, restored, or substantially changed:

- update the relevant doc
- note what changed
- note what still is not done

This keeps the repo understandable even after long multi-step work.
