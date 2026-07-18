# 02 Mid-Level Feature Tickets

Each ticket crosses at least two layers. Write design notes before coding.

## Ticket 1: Transactional Issue Update Audit
**Scope:** API + tests.
**Design notes required:** invariant, failure mode, transaction plan.
**Anchors:** `apps/api/src/routes/projects.ts:196-216`, `apps/api/prisma/schema.prisma:84-93`.
**Acceptance:** Issue update and audit insert succeed/fail together.
**Risk:** Changes write semantics.
**Rollback:** Revert to separate writes.
**Tests:** update success creates audit; forced failure does not update.

## Ticket 2: Resource-Level Project Authorization
**Scope:** schema + seed + middleware/routes + tests.
**Anchors:** `apps/api/src/middleware/requestContext.ts:29-43`, `apps/api/src/routes/projects.ts:190-197`.
**Acceptance:** User can update only issues in projects they belong to.
**Risk:** Requires membership model.
**Rollback:** Keep role-only behavior behind branch until ready.

## Ticket 3: Issue Comments
**Scope:** Prisma schema/bootstrap/seed + shared schema + API + UI + tests.
**Anchors:** `apps/api/prisma/schema.prisma:61-93`, `packages/shared/src/index.ts:37-88`, `apps/web/src/App.tsx:228-317`.
**Acceptance:** View/add comments on selected issue.
**Risk:** XSS if rendering rich text; keep plain text.
**Rollback:** Hide UI, keep data migration if safe.

## Ticket 4: Create Issue From UI
**Scope:** UI + API tests.
**Anchors:** `apps/api/src/routes/projects.ts:129-180`, `apps/web/src/App.tsx:159-193`.
**Acceptance:** User creates issue in selected project and board updates.
**Risk:** Duplicate key under concurrency remains.
**Rollback:** Disable form; API route already exists.

## Ticket 5: Board Request Cancellation
**Scope:** UI client.
**Anchors:** `apps/web/src/App.tsx:51-74`, `apps/web/src/lib/api.ts:13-29`.
**Acceptance:** Rapid project switching cannot show stale board.
**Risk:** Fetch wrapper API change.
**Rollback:** Restore `isMounted` only.

## Ticket 6: Typed API Error Model
**Scope:** shared + API + web.
**Anchors:** `apps/api/src/app.ts:30-42`, `apps/web/src/lib/api.ts:22-28`.
**Acceptance:** Client preserves `code`, `message`, optional details.
**Risk:** Breaking error display.
**Rollback:** Fall back to message-only.

## Ticket 7: Pagination For Audit
**Scope:** API + shared schema + UI/docs.
**Anchors:** `apps/api/src/routes/projects.ts:222-237`.
**Acceptance:** `/api/audit?cursor=` returns limited page.
**Risk:** Cursor consistency.
**Rollback:** Keep `take: 50`.

## Ticket 8: Board Query Indexes
**Scope:** schema/bootstrap + performance notes + tests.
**Anchors:** `apps/api/prisma/schema.prisma:61-82`, `apps/api/src/routes/projects.ts:84-85`.
**Acceptance:** Index supports project/status/rank access.
**Risk:** Bootstrap/schema drift.
**Rollback:** Drop index in migration/bootstrap.

## Ticket 9: React Query Data Layer
**Scope:** web only initially.
**Anchors:** `apps/web/src/App.tsx:30-99`, `apps/web/src/lib/api.ts:31-44`.
**Acceptance:** Portfolio/board/update use query keys with project key.
**Risk:** Premature abstraction in small app.
**Rollback:** Keep old hooks until parity.

## Ticket 10: Real Prisma Migrations
**Scope:** DB tooling + docs + CI later.
**Anchors:** `apps/api/prisma/bootstrap.ts:5-97`, `apps/api/prisma/schema.prisma:10-93`, `apps/api/package.json:11-13`.
**Acceptance:** Migration workflow replaces bootstrap for normal use.
**Risk:** Local machine Prisma engine issues.
**Rollback:** Keep bootstrap as fallback.
