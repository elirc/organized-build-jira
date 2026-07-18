# 04 Review Katas

## Kata 1: "Trust x-user-id In Production"
**Author intent:** Make auth easy.
**Fake diff summary:** Documents `x-user-id` as production auth.
**Files this resembles:** `apps/api/src/middleware/requestContext.ts:15-24`
**Expected findings:** Blocking: spoofable identity. Important: add auth boundary design. Optional: rename middleware to demo context.
**Good review comment example:**
> Blocking for production: `x-user-id` is caller-controlled. Can we keep this as a dev-only demo actor and add a verified session/JWT boundary before documenting it as auth?

## Kata 2: "Update Issue Without Audit"
**Author intent:** Simplify route.
**Fake diff summary:** Removes audit insert after issue update.
**Files this resembles:** `apps/api/src/routes/projects.ts:208-216`
**Expected findings:** Blocking: product/audit regression if audit is expected. Important: add test. Optional: transaction refactor.
**Good review comment example:**
> This removes an observable side effect. Please either update the product contract and tests or keep audit and add coverage for it.

## Kata 3: "Return Raw Prisma User"
**Author intent:** Save mapper code.
**Fake diff summary:** Replaces `userSelect` with broad include.
**Files this resembles:** `apps/api/src/routes/projects.ts:16-22`
**Expected findings:** Blocking if sensitive fields exist. Important: overfetching. Optional: document DTO.
**Good review comment example:**
> The select is protecting our public API shape. Let's keep explicit fields and add new fields intentionally through the shared schema.

## Kata 4: "Add Status By Editing UI Only"
**Author intent:** Add `BLOCKED` option.
**Fake diff summary:** Adds option in select but not shared schema/API seed.
**Files this resembles:** `apps/web/src/App.tsx:273-279`, `packages/shared/src/index.ts:3`
**Expected findings:** Blocking: server rejects value. Important: contract migration. Optional: visual tone.
**Good review comment example:**
> Status is a shared contract. Please update `issueStatusSchema`, DB seed/columns, route mapping, and tests in the same PR or split behind a design note.

## Kata 5: "Load Board With Per-Issue User Queries"
**Author intent:** Make query code easier.
**Fake diff summary:** Loops through issues and fetches assignee one at a time.
**Files this resembles:** `apps/api/src/routes/projects.ts:84-89`
**Expected findings:** Blocking for large boards: N+1. Important: latency. Optional: add query count test later.
**Good review comment example:**
> This introduces one query per issue. The existing include keeps the board read bounded; let's keep that pattern or measure before changing it.

## Kata 6: "Catch And Ignore Client Save Errors"
**Author intent:** Stop spinner from hanging.
**Fake diff summary:** Adds empty catch in `IssuePanel.save`.
**Files this resembles:** `apps/web/src/App.tsx:252-260`
**Expected findings:** Important: user loses failure visibility. Optional: toast/error row.
**Good review comment example:**
> Resetting saving is good, but swallowing the error leaves the user thinking the change worked. Can we render a field-level or panel-level save error?

## Kata 7: "Remove Zod Client Parsing"
**Author intent:** Improve performance.
**Fake diff summary:** `return payload as T`.
**Files this resembles:** `apps/web/src/lib/api.ts:28`
**Expected findings:** Important: contract drift hidden. Optional: measure cost before removing.
**Good review comment example:**
> This removes our runtime contract check. If performance is a concern, can we measure parse cost first and keep validation in development at minimum?

## Kata 8: "Unbounded Audit Endpoint"
**Author intent:** Show complete history.
**Fake diff summary:** Removes `take: 50`.
**Files this resembles:** `apps/api/src/routes/projects.ts:222-227`
**Expected findings:** Important: unbounded response. Optional: pagination.
**Good review comment example:**
> Complete history needs pagination; otherwise one busy project can make this endpoint slow or unusable.

## Kata 9: "Add Raw SQL Search"
**Author intent:** Search issues quickly.
**Fake diff summary:** Interpolates query string into `$executeRawUnsafe`.
**Files this resembles:** `apps/api/prisma/bootstrap.ts:6-96`
**Expected findings:** Blocking: SQL injection. Important: use Prisma filters or parameterized query.
**Good review comment example:**
> `$executeRawUnsafe` is only acceptable here for static bootstrap SQL. For user search, use Prisma query filters or parameterized raw SQL.

## Kata 10: "Schema Change Without Seed"
**Author intent:** Add due date required.
**Fake diff summary:** Makes `dueDate` required in shared schema only.
**Files this resembles:** `packages/shared/src/index.ts:47`, `apps/api/prisma/seed.ts:96-180`
**Expected findings:** Blocking: existing seeded issues and API mapper may break. Important: migration plan.
**Good review comment example:**
> Required fields need migration and seed updates. Please include compatibility handling or a data migration plan.
