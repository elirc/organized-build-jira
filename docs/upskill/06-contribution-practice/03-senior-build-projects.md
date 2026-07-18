# 03 Senior Build Projects

## Project 1: Production Authentication Boundary
**Problem statement:** Demo actor is spoofable (`apps/api/src/middleware/requestContext.ts:15-24`).
**Product value:** Safe multi-user practice environment.
**Design checklist:** session/JWT provider, actor shape compatibility, 401/403 model.
**Architecture decisions:** keep `req.actor`; replace source.
**Likely files:** middleware, app, tests, env docs.
**Migration plan:** add auth middleware behind config; keep demo mode for local.
**Test plan:** no token, invalid token, viewer, engineer, manager.
**Security plan:** no client secrets in Vite env.
**Performance plan:** cache/session lookup strategy.
**Rollout/rollback:** feature flag demo vs real auth.
**Open questions:** OIDC vs simple signed token?
**Stretch:** SAML/OIDC docs.

## Project 2: Tenant/Project Membership Isolation
**Problem statement:** Role guard lacks resource isolation (`apps/api/src/routes/projects.ts:190-197`).
**Product value:** Prevent IDOR and prepare enterprise model.
**Design checklist:** membership schema, route filters, seed data.
**Architecture decisions:** project membership table vs workspace tenant.
**Likely files:** Prisma schema/bootstrap/seed, routes, shared schemas, tests.
**Migration plan:** add membership table, backfill lead/members.
**Test plan:** cross-project read/write rejection.
**Security plan:** deny by default.
**Performance plan:** index membership lookups.
**Rollout/rollback:** read-only compatibility first.
**Open questions:** Are viewers project-scoped?
**Stretch:** admin bypass audit.

## Project 3: Transactional Audit And Outbox
**Problem statement:** Audit writes are separate from mutations (`apps/api/src/routes/projects.ts:196-216`).
**Product value:** Trustworthy activity history.
**Design checklist:** transaction, event schema, retry worker if async.
**Architecture decisions:** direct audit table vs outbox table.
**Likely files:** routes, Prisma schema, tests.
**Migration plan:** introduce transaction now, outbox later.
**Test plan:** success/failure atomicity.
**Security plan:** audit actor/resource integrity.
**Performance plan:** measure write latency.
**Rollout/rollback:** revert transaction wrapper if issues.
**Open questions:** Is audit compliance-critical?
**Stretch:** audit UI.

## Project 4: Comments And Activity Stream
**Problem statement:** Issues lack collaboration history.
**Product value:** More Jira-like workflow.
**Design checklist:** comments schema, plain text rendering, permissions.
**Architecture decisions:** comments table plus activity projection.
**Likely files:** schema/bootstrap/seed, shared, routes, UI panel, tests.
**Migration plan:** add optional comments table.
**Test plan:** create/list comment, viewer rules.
**Security plan:** XSS-safe rendering, auth.
**Performance plan:** paginate comments.
**Rollout/rollback:** hide UI if API stable.
**Open questions:** edit/delete policy?
**Stretch:** mentions.

## Project 5: CI And Quality Gate
**Problem statement:** No CI config found.
**Product value:** Prevent regressions.
**Design checklist:** Node version, install cache, DB bootstrap/seed, build/lint/test.
**Likely files:** `.github/workflows/*`, docs.
**Migration plan:** add CI after local commands stable.
**Test plan:** CI runs `npm ci`, generate, migrate, seed, lint, build, tests.
**Security plan:** no secrets needed initially.
**Performance plan:** cache npm.
**Rollout/rollback:** disable workflow on failure.
**Open questions:** GitHub Actions target?
**Stretch:** Docker build check.

## Project 6: Board Scale And Pagination
**Problem statement:** Board loads all issues and team (`apps/api/src/routes/projects.ts:79-126`).
**Product value:** Larger projects remain responsive.
**Design checklist:** payload size, pagination/windowing, filters.
**Architecture decisions:** board pages vs virtualized UI.
**Likely files:** API route, shared schema, UI render, tests.
**Migration plan:** introduce optional query params, keep old default.
**Test plan:** response shape and filter behavior.
**Security plan:** filters preserve permissions.
**Performance plan:** indexes and render profiling.
**Rollout/rollback:** default old behavior until UI ready.
**Open questions:** Do columns page independently?
**Stretch:** drag-and-drop rank updates.
