# 04 Refactor And Design Katas

## Kata 1: Identify A Boundary Leak
Find a place where UI, API, or DB responsibilities blur. Candidate: UI casts select values (`apps/web/src/App.tsx:273`, `apps/web/src/App.tsx:296`).
Self-grade: strong answer names owner, risk, test, and smallest refactor.

## Kata 2: Propose Outbox/Eventing
Use audit writes (`apps/api/src/routes/projects.ts:208-216`) as the starting point.
Self-grade: strong answer covers idempotency, retries, transaction, and visibility.

## Kata 3: Split A Large Module
Route file `apps/api/src/routes/projects.ts:24-237` contains helpers, reads, writes, audit. Propose extraction boundaries.
Self-grade: strong answer avoids premature abstraction and preserves tests.

## Kata 4: Remove Duplication
Compare Prisma schema and bootstrap SQL (`apps/api/prisma/schema.prisma:10-93`, `apps/api/prisma/bootstrap.ts:5-97`).
Self-grade: strong answer proposes migration tool or drift check.

## Kata 5: Improve Type Safety
Inspect `toIso` casts (`apps/api/src/routes/projects.ts:32-51`).
Self-grade: strong answer replaces unsafe casts with typed mapper inputs.

## Kata 6: Design A Migration
Add `Project.archivedAt`. Touch schema, bootstrap, seed, shared contract if public, UI filtering, tests.
Self-grade: strong answer includes rollback and old-data behavior.

## Kata 7: Reduce N+1
Write a fake N+1 route and refactor it to the include pattern in `apps/api/src/routes/projects.ts:84-89`.
Self-grade: strong answer can measure query count.

## Kata 8: Write An RFC
RFC topic: "Real authentication boundary." Use anchors `apps/api/src/middleware/requestContext.ts:15-43` and `apps/api/src/app.ts:18`.
Self-grade: strong RFC states non-goals, migration, tests, security, rollout.

## Kata 9: Review A Flawed PR
Review a fake PR that removes client Zod parsing (`apps/web/src/lib/api.ts:28`).
Self-grade: strong review is kind, specific, and suggests measurement or safer alternative.
