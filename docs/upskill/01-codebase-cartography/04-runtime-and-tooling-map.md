# 04 Runtime And Tooling Map

## Package Manager And Workspaces

This repo uses npm workspaces. The root workspace includes `packages/*` and `apps/*` (`package.json:7-10`). The root `dev` script first builds the shared package, then starts API and web concurrently (`package.json:12`).

## Runtimes

| Runtime | Files | Mental model |
| --- | --- | --- |
| Browser | `apps/web/src/main.tsx:1-16`, `apps/web/src/App.tsx:21-335` | React renders state into DOM and calls the API through fetch. |
| Node API | `apps/api/src/server.ts:1-7`, `apps/api/src/app.ts:11-47` | Express receives HTTP, runs middleware, calls routers, returns JSON. |
| Shared package | `packages/shared/package.json:6-17`, `packages/shared/src/index.ts:1-101` | Zod schemas compile to JS and `.d.ts` types. |
| SQLite/Prisma | `apps/api/prisma/schema.prisma:1-93`, `apps/api/src/lib/prisma.ts:1-5` | Prisma client maps TypeScript calls to SQLite queries. |
| Docker | `docker-compose.yml:1-27` | Builds API and web images for local production-like runs. |

## Environment Variables

| Variable | Source | Used by | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | `.env.example:1`, `apps/api/src/config/env.ts:6` | Prisma | `file:./dev.db` resolves relative to Prisma schema directory. |
| `API_PORT` | `.env.example:2`, `apps/api/src/config/env.ts:7` | API server | Defaults to `4000`. |
| `WEB_ORIGIN` | `.env.example:3`, `apps/api/src/config/env.ts:8` | CORS | Defaults to Vite dev origin. |
| `VITE_API_URL` | `.env.example:4`, `apps/web/src/lib/api.ts:11` | Browser build | Exposed to client by Vite. |

No secrets are currently required. If auth is added, never commit issuer secrets, client secrets, signing keys, or database passwords.

## Tooling

| Concern | Command | Evidence |
| --- | --- | --- |
| Dev | `npm run dev` | `package.json:12` |
| Full build | `npm run build` | `package.json:13` |
| API test | `npm run test -w @buildjira/api` | `apps/api/package.json:10` |
| Lint | `npm run lint` | `package.json:15`, `eslint.config.js:1-15` |
| Format | `npm run format` | `package.json:16` |
| Prisma generate | `npm run db:generate` | `package.json:17`, `apps/api/package.json:11` |
| DB bootstrap | `npm run db:migrate` | `package.json:18`, `apps/api/package.json:12` |
| Seed | `npm run db:seed` | `package.json:19`, `apps/api/package.json:13` |

## Tooling Risks

- `apps/api/package.json:37-39` uses deprecated Prisma package config; investigate before Prisma 7.
- `apps/api/Dockerfile:20` runs bootstrap at container start. Convenient for practice, not a full migration discipline.
- No CI workflow exists. Treat local `build`, `lint`, and `test` as the current gate.

## Drill

Run `npm run build` after restoring dependencies and explain which workspace builds first and why. Hint: shared contracts must exist before API/web imports are typechecked.
