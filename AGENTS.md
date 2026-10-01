# Repository Guidelines

## Project Structure & Module Organization

ST3 is a Next.js 16 and TypeScript application. Application routes and API handlers live in `src/app/`. Reusable interface components belong in `src/components/`, while wallet, compilation, contract, queue, and persistence logic belongs in `src/lib/`. Contract ABIs are stored in `abi/` and deployment artifacts in `contracts json/`. Static website assets live in `public/`. Operational scripts use `scripts/`, background processes use `workers/`, and Vitest suites live in `test/`.

Consult the bundled Next.js guidance in `node_modules/next/dist/docs/` when working with framework APIs and conventions.

## Build, Test, and Development Commands

- `npm run dev` starts the local dashboard through `scripts/dev.mjs`.
- `npm test -- --run` runs the complete Vitest suite once.
- `npm run test:watch` provides continuous testing during development.
- `npm run test:coverage` generates coverage results.
- `npm run lint` checks Next.js and TypeScript style rules.
- `npx tsc --noEmit` performs strict type validation.
- `npm run build` creates the production Next.js build with webpack.
- `npm run workers` starts all background workers.

Use Node.js 22 or newer, matching `package.json`.

## Coding Style & Naming Conventions

Use TypeScript with two-space indentation, semicolons, and double quotes. Name React components with PascalCase, functions and variables with camelCase, and files with descriptive kebab-case names such as `contract-actions.ts`. Prefer the `@/` alias for imports from `src/`. Keep UI components focused and place reusable business logic in `src/lib/`. ESLint configuration lives in `eslint.config.mjs`.

## Testing Guidelines

Vitest is the project test framework. Name suites `*.test.ts` and place them in `test/`. Add focused regression coverage for compiler output, API routes, ABI encoding, and configuration changes. Run the focused suite while developing, followed by the full suite, type check, and production build before handoff.

## Commit & Pull Request Guidelines

Follow the repository’s concise commit style, commonly `feat:`, `fix:`, `docs:`, and `test:` followed by an imperative summary. Keep each commit centered on one coherent change. Pull requests should explain the user-facing result, list verification commands, link relevant issues, and include screenshots for dashboard changes.

## Security & Configuration

Store local credentials and service URLs in `.env.local`. Provide documented example values for collaborators. Keep contract addresses, ABIs, execution strategies, wallet framework selection, and receiver configuration explicit and reviewable.
