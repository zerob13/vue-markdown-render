# Repository Guidelines

Use this guide to keep the Vue Markdown Renderer consistent, testable, and easy to review.

## Project Structure & Module Organization
The library source lives under `src/`. Add components in PascalCase folders such as `src/components/CodeBlockNode/CodeBlockNode.vue` with an accompanying `index.ts`. Shared helpers belong in `src/utils/`, `src/types/`, or `src/composables/`, while `src/exports.ts` exposes public entry points and `src/index.css` holds shared styles. Tests reside in `test/` (for example `test/index.test.ts` or `test/plugins/parser.test.ts`). Use `playground/` for the demo Vite app, maintain scripts in `scripts/`, and store Vite, Tailwind, ESLint, and EditorConfig settings at the repo root.

## Build, Test, and Development Commands
Use `pnpm dev` (alias `pnpm play`) to run the playground on Vite’s dev server and `pnpm preview` to inspect a production build. Execute `pnpm build` to compile the library bundle and generate CSS; reach for `pnpm build:demo` and `pnpm build:view` when validating the demo site. Keep quality high with `pnpm lint`, `pnpm lint:fix`, and `pnpm typecheck`. Run unit suites through `pnpm test` or the UI runner `pnpm test:ui`, regenerate snapshots via `pnpm test:update`, and audit peer packages with `pnpm run check:peer-deps`.

## Coding Style & Naming Conventions
Follow TypeScript-first, Vue 3 Single File Components. Enforce 2-space indentation, LF endings, and UTF-8 per `.editorconfig`. Name directories and components in PascalCase, prefix composables with `use`, and export helpers in camelCase. Mirror existing naming schemes in `src/utils/`. Honor `@antfu/eslint-config` and run `pnpm lint` before every push.

## Testing Guidelines
Vitest powers the suite. Scope specs narrowly per component, parser, or composable, placing them under `test/` with a `.test.ts` suffix. Cover new utilities with fast unit tests, add interaction or snapshot checks for visual nodes, and run `pnpm test` locally before every PR. Update snapshots with `pnpm test:update` when rendered output changes.

## Commit & Pull Request Guidelines
Write Conventional Commit messages (`feat:`, `fix:`, `perf:`, `chore:`) and reference issues with GitHub keywords (`closes #123`). Before raising a PR, ensure `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm dev` all pass. PR descriptions should explain the problem, summarize the solution, include UI screenshots or GIFs when relevant, and highlight API or prop changes. Update README or docs when behavior shifts.

## Security & Configuration Tips
Keep `peerDependencies` current to avoid bundling peers inadvertently. When touching Markdown tooling, Monaco integration, or Tailwind layers, verify config files and ensure `pnpm build` and `pnpm build:demo` remain green. Favor dev-only packages for build tooling to keep the runtime lean.
