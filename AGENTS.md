# Repository Guidelines

## Project Structure & Module Organization
- `src/` – library source
  - `components/*/` (PascalCase dirs, `*.vue` + `index.ts` exports)
  - `utils/` (parsers, helpers), `types/`, `composables/`
  - Entry: `exports.ts`, styles: `index.css`
- `test/` – Vitest specs (e.g., `index.test.ts`, `plugins/*.test.ts`)
- `playground/` – local demo app used during development
- `scripts/` – maintenance utilities (e.g., peer-deps check)
- Config: `vite.config.ts`, `tailwind.config.js`, `eslint.config.mjs`, `.editorconfig`

## Build, Test, and Development Commands
- `pnpm dev` – run playground locally (Vite dev server)
- `pnpm play` / `pnpm preview` – alias dev / preview demo build
- `pnpm build` – build library (Vite) + CSS (`build-css.ts`)
- `pnpm build:demo` / `pnpm build:view` – build/preview the demo site
- `pnpm test` / `pnpm test:ui` – run tests (CLI/UI)
- `pnpm typecheck` – TypeScript check
- `pnpm lint` / `pnpm lint:fix` – ESLint validate/fix
- `pnpm run check:peer-deps` – verify required peers are installed

## Coding Style & Naming Conventions
- Follow TypeScript-first, Vue 3 SFCs.
- Components: PascalCase dir and SFC names (`CodeBlockNode/CodeBlockNode.vue`).
- Utils/functions: camelCase; files in `utils/` are kebab/camel case as existing.
- Indentation 2 spaces, LF endings, UTF‑8 (see `.editorconfig`).
- Linting via `@antfu/eslint-config`; run `pnpm lint` before commits.

## Testing Guidelines
- Framework: Vitest. Place specs under `test/` with `*.test.ts`.
- Prefer small, focused tests for parsers and node components.
- Run `pnpm test` locally; update snapshots when needed with `pnpm test:update`.

## Commit & Pull Request Guidelines
- Commit style: Conventional Commits (`feat:`, `fix:`, `perf:`, `chore:` …).
- Link issues using GitHub keywords (`close: #123`).
- Before PR: run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and verify `pnpm dev` in playground.
- PRs should include: clear description, rationale, screenshots/GIFs for UI-visible changes, and notes on API/prop changes (update README if needed).

## Security & Configuration Tips
- Keep `peerDependencies` accurate; avoid bundling heavy peers—declare as peers when appropriate.
- If integrating Monaco/Tailwind changes, ensure related Vite/Tailwind configs remain consistent and demo still builds.
