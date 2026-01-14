# AGENTS.md

## Repository scope
This file applies to the entire repository.

## Project summary
Accomplish is a standalone Electron desktop app with a local React UI (bundled via Vite). The main process spawns the Claude Code CLI to execute user tasks. Shared TypeScript types live in `packages/shared`.

## Monorepo layout
- `apps/desktop`: Electron main/preload/renderer code.
- `packages/shared`: Shared TypeScript types for IPC payloads.

## Development workflow
- Use **pnpm workspaces** from the repo root.
- Prefer workspace-scoped commands with `pnpm -F <package>` for app-specific tasks.
- Node 20+ and pnpm 9+ are required.

Common commands:
- `pnpm dev` (desktop app via workspace filter)
- `pnpm build` (all workspaces)
- `pnpm lint` / `pnpm typecheck` (workspace checks)

## Code conventions
- TypeScript everywhere (avoid JS for app logic).
- Keep IPC and API payloads in sync by updating `packages/shared` types first.
- For Electron IPC work, ensure handler types match `window.accomplish` bridge definitions.
- Do not edit generated output or dependencies (e.g., `node_modules`, `dist`, `.next`).

## Testing
- `pnpm -F @accomplish/desktop test:e2e` for Playwright E2E.
- Run `pnpm lint` and `pnpm typecheck` for validation when changes are significant.

## Documentation
- Update relevant docs or comments when behavior changes.
- Prefer concise, scoped commits.
