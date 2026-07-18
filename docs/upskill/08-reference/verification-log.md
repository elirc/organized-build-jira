# Verification Log

Date: 2026-05-29

## Commands Run

| Command | Result | Notes |
| --- | --- | --- |
| `rg --files -g '!node_modules' -g '!dist'` | Passed | File inventory collected. |
| `git status --short -- .` | Passed | Returned `?? ./` because project is inside a parent worktree and untracked. |
| `npm install` | Eventually passed with caveats | Initial install hung/failed under zero disk space; repaired shims with `npm rebuild`. |
| `npm run db:generate -w @buildjira/api` | Passed | Prisma client generated after clearing local cache. |
| `npm run db:migrate -w @buildjira/api` | Passed | Uses `tsx prisma/bootstrap.ts`. |
| `npm run db:seed -w @buildjira/api` | Passed | Seeded demo users/projects/issues. |
| `npm run build` | Passed before docs | Built shared, API, web. |
| `npm run lint` | Passed before docs | ESLint passed. |
| `npm run test -w @buildjira/api` | Passed before docs | 3 API tests passed. |
| HTTP `http://localhost:5173` | Passed before docs | Returned 200. |
| HTTP `http://localhost:4000/health` | Passed before docs | Returned status ok. |
| HTTP `http://localhost:4000/api/projects` | Passed before docs | Returned 2 projects. |

## Files Inspected

- Root metadata: `README.md`, `package.json`, `package-lock.json`, `.env.example`, `.gitignore`, `tsconfig.base.json`, `eslint.config.js`.
- Workspaces: `apps/api/package.json`, `apps/web/package.json`, `packages/shared/package.json`.
- API: `apps/api/src/app.ts`, `apps/api/src/server.ts`, `apps/api/src/config/env.ts`, `apps/api/src/lib/prisma.ts`, `apps/api/src/routes/health.ts`, `apps/api/src/routes/projects.ts`, `apps/api/src/middleware/requestContext.ts`.
- Web: `apps/web/src/main.tsx`, `apps/web/src/App.tsx`, `apps/web/src/lib/api.ts`, `apps/web/src/styles/global.css`, `apps/web/src/types/lucide-react.d.ts`.
- Persistence: `apps/api/prisma/schema.prisma`, `apps/api/prisma/bootstrap.ts`, `apps/api/prisma/seed.ts`.
- Tests: `apps/api/test/projects.test.ts`.
- Runtime/deployment: `docker-compose.yml`, `apps/api/Dockerfile`, `apps/web/Dockerfile`.

## Uncertainties And Areas Not Covered

- No CI config was found.
- No background worker, queue, cron, webhook, email, file upload, cache, or metrics/tracing implementation was found.
- Browser automation could not be used because the in-app browser backend was unavailable in this session; HTTP smoke checks were used instead.
- `node_modules` was removed during the docs pass to recover disk space. Run `npm install` before executing project commands again.
- Some docs propose future behavior; those are labeled as tickets, katas, risks, or hypotheses rather than current implementation.
