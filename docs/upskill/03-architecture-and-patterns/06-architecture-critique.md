# 06 Architecture Critique

## Strong Choices

- Shared Zod contracts reduce client/server drift (`packages/shared/src/index.ts:3-101`).
- Express app factory enables Supertest without binding a port (`apps/api/src/app.ts:11-47`, `apps/api/test/projects.test.ts:6`).
- Security middleware and CORS are installed early (`apps/api/src/app.ts:14-16`).
- User projection avoids broad user leakage (`apps/api/src/routes/projects.ts:16-22`).
- Seed data covers multiple roles, projects, statuses, priorities, and issue types (`apps/api/prisma/seed.ts:21-180`).

## Confirmed Risks

| Risk | Evidence | Impact | Improvement |
| --- | --- | --- | --- |
| Demo auth is spoofable | `apps/api/src/middleware/requestContext.ts:15-20` | Any caller can impersonate by header. | Replace with session/JWT/OIDC middleware and test 401/403. |
| No resource-level authorization | `apps/api/src/routes/projects.ts:190-197` | IDOR risk for issue updates. | Join issue to project membership before update. |
| Audit not transactional | `apps/api/src/routes/projects.ts:196-216` | Mutations can exist without audit. | Wrap update + audit in Prisma transaction. |
| Bootstrap/schema drift | `apps/api/prisma/schema.prisma:10-93`, `apps/api/prisma/bootstrap.ts:5-97` | Local/prod mismatch. | Move to real migrations when environment allows. |
| Thin test coverage | `apps/api/test/projects.test.ts:15-34` | Permissions, happy-path writes, audit, errors untested. | Add focused API tests. |
| Client error handling is shallow | `apps/web/src/lib/api.ts:22-28`, `apps/web/src/App.tsx:252-260` | Failed saves are not visible. | Preserve error code/details and render save errors. |

## Hypotheses To Investigate

- Board query may overfetch as issue count grows (`apps/api/src/routes/projects.ts:79-93`).
- Refiltering issues per column may become expensive with large boards (`apps/web/src/App.tsx:170-171`).
- Route file may become too large as features are added (`apps/api/src/routes/projects.ts:24-237`).

## Three-Month Ownership Plan

1. **Testing baseline:** Add permission, health, create/update happy path, audit, and error tests. Migration path: no product behavior change; start with `apps/api/test/projects.test.ts`.
2. **Auth boundary:** Replace demo actor with pluggable auth middleware. Migration path: keep `req.actor` shape, change how it is populated. Tests: no actor -> 401, viewer -> 403, engineer -> permitted.
3. **Resource isolation:** Add project membership or tenant model. Migration path: schema + seed + route filters + tests. Rollback: keep role-only route behind feature branch until tests pass.
4. **Transactional audit:** Wrap writes with audit in transaction. Migration path: refactor create/update route internals; tests assert audit on success.
5. **Real migrations:** Replace bootstrap with Prisma migrations or another migration tool. Migration path: keep bootstrap only for emergency local setup; CI runs migration validation.
6. **Client data layer:** Introduce React Query or equivalent only after more screens exist. Migration path: wrap current `getProjects/getBoard/updateIssue` functions.

## Senior Kata

Write a one-page RFC for "transactional issue update with audit event." Include invariant, migration plan, tests, rollback, and what you deliberately are not changing.
