# 01 Boundaries And Layers

| Layer | Owns | Must not own | Repo example |
| --- | --- | --- | --- |
| UI | Rendering, local state, user events | DB rules, auth decisions | `apps/web/src/App.tsx:21-335` |
| Client transport | Fetch, response parsing, API errors | Business invariants | `apps/web/src/lib/api.ts:13-44` |
| API transport | Middleware, route matching, HTTP errors | Browser rendering | `apps/api/src/app.ts:14-45` |
| Application/domain | Validation, permission checks, orchestration | CSS or component state | `apps/api/src/routes/projects.ts:129-218` |
| Persistence | Models, relations, queries | HTTP details | `apps/api/prisma/schema.prisma:10-93` |
| Tests | Behavior checks | Production side effects | `apps/api/test/projects.test.ts:15-34` |

## Good Boundaries

- Shared schemas define contract once and are consumed by both client and server (`packages/shared/src/index.ts:3-101`).
- Express middleware order puts cross-cutting concerns before route handlers (`apps/api/src/app.ts:14-21`).
- `userSelect` limits user fields returned from Prisma (`apps/api/src/routes/projects.ts:16-22`).

## Boundary Leaks And Possible Risks

- UI casts select values to domain enums (`apps/web/src/App.tsx:273`, `apps/web/src/App.tsx:296`). This is acceptable with server validation, but stronger UI typing could reduce bad calls.
- API route file contains mapping helpers, query orchestration, validation, and audit writes (`apps/api/src/routes/projects.ts:24-237`). Fine now; as it grows, split service/mappers.
- Bootstrap SQL duplicates Prisma schema (`apps/api/prisma/schema.prisma:10-93`, `apps/api/prisma/bootstrap.ts:8-96`). This is a confirmed maintenance risk.

## Drill

Pick one future feature: issue comments. Write which layer owns comments UI, API validation, persistence, and audit event. Self-grade by whether any layer takes responsibility it should not.
