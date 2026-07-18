# 04 Tooling And Build System

## Build Graph

Root `npm run build` delegates to every workspace (`package.json:13`). The shared package builds with TypeScript (`packages/shared/package.json:13-15`). API builds with `tsc` (`apps/api/package.json:8`). Web builds with `tsc -b` and Vite (`apps/web/package.json:8`).

Why shared builds first during dev:

- Root `dev` explicitly runs `npm run build -w @buildjira/shared` before starting servers (`package.json:12`).
- API and web import `@buildjira/shared` (`apps/api/package.json:16`, `apps/web/package.json:12`).

## TypeScript Configuration

Strict settings are centralized in `tsconfig.base.json:2-18`. Important flags:

- `strict: true` (`tsconfig.base.json:10`) raises the floor.
- `noUncheckedIndexedAccess: true` (`tsconfig.base.json:16`) makes indexed reads safer.
- `noImplicitOverride: true` (`tsconfig.base.json:17`) matters more once classes appear.

## Linting

ESLint config ignores build outputs and DB files (`eslint.config.js:4-7`) and warns on explicit `any` (`eslint.config.js:10-13`).

## Docker

API Dockerfile:

- Installs dependencies (`apps/api/Dockerfile:1-6`).
- Generates Prisma and builds API (`apps/api/Dockerfile:8-11`).
- Runs bootstrap and API server (`apps/api/Dockerfile:20`).

Web Dockerfile:

- Builds Vite bundle with `VITE_API_URL` (`apps/web/Dockerfile:1-10`).
- Serves static files with nginx (`apps/web/Dockerfile:12-14`).

## Generated Artifacts

Do not review generated `dist`, `node_modules`, SQLite DB files, or `.tsbuildinfo`. `.gitignore` excludes `dist`, `node_modules`, and local SQLite files.

## Drill

Break the shared schema intentionally in a scratch branch. Predict which workspaces fail first. Then restore it. Strong answer explains why contract packages create useful friction.
