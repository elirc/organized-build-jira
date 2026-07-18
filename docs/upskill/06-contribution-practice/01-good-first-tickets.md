# 01 Good First Tickets

## Ticket 1: Add Health Endpoint Test
**Difficulty:** Easy
**Estimated time:** 30 minutes
**Skills practiced:** Supertest, API smoke testing.
**Story:** As a maintainer, I want `/health` covered so local readiness does not regress.
**Why this is a good contribution:** Useful, tiny, follows existing test style.
**Acceptance criteria:**
- [ ] `GET /health` returns 200.
- [ ] Response includes `status: "ok"`.
**Read these anchors first:** `apps/api/src/routes/health.ts:6-13`, `apps/api/test/projects.test.ts:15-34`.
**Files likely touched:** `apps/api/test/projects.test.ts`.
**Implementation plan:** Add a new `it` block using `request(app).get("/health")`.
**Illustrative fake-code shape:**
```ts
// Illustrative fake code: adapt to the repo.
await request(app).get("/health").expect(200);
```
**What could go wrong:** Test DB not bootstrapped.
**Suggested checks:** `npm run test -w @buildjira/api`.
**Review questions:** Does the test assert behavior, not timestamp exactness?

## Ticket 2: Add Invalid Status Test
**Difficulty:** Easy
**Estimated time:** 45 minutes
**Skills practiced:** Zod validation, negative tests.
**Story:** As a maintainer, I want invalid issue statuses rejected.
**Why this is a good contribution:** Extends existing validation coverage.
**Acceptance criteria:** PATCH with `{ "status": "BLOCKED" }` returns 400.
**Read these anchors first:** `packages/shared/src/index.ts:3`, `apps/api/src/routes/projects.ts:187`, `apps/api/test/projects.test.ts:28-33`.
**Files likely touched:** `apps/api/test/projects.test.ts`.
**Implementation plan:** Fetch board, use first issue id, PATCH invalid status, expect 400.
**Illustrative fake-code shape:**
```ts
// Illustrative fake code: adapt to the repo.
await request(app).patch(`/api/issues/${id}`).send({ status: "BLOCKED" }).expect(400);
```
**What could go wrong:** Test accidentally uses valid future status.
**Suggested checks:** API tests.
**Review questions:** Does the test fail for validation specifically?

## Ticket 3: Add Project Not Found Test
**Difficulty:** Easy
**Estimated time:** 30 minutes
**Skills practiced:** Error behavior.
**Story:** As an API consumer, I want missing project keys to return stable 404 JSON.
**Acceptance criteria:** `GET /api/projects/NOPE/board` returns 404 and `PROJECT_NOT_FOUND`.
**Read these anchors first:** `apps/api/src/routes/projects.ts:95-98`.
**Files likely touched:** `apps/api/test/projects.test.ts`.
**Implementation plan:** Add route test.
**Illustrative fake-code shape:**
```ts
// Illustrative fake code: adapt to the repo.
const res = await request(app).get("/api/projects/NOPE/board").expect(404);
```
**What could go wrong:** Case handling masks wrong test key.
**Suggested checks:** API tests.
**Review questions:** Is error code asserted?

## Ticket 4: Add Viewer Permission Test
**Difficulty:** Medium
**Estimated time:** 1 hour
**Skills practiced:** Auth context, seeded data, 403.
**Story:** As a maintainer, I want viewers blocked from issue updates.
**Acceptance criteria:** PATCH with Sam's seeded user id returns 403.
**Read these anchors first:** `apps/api/prisma/seed.ts:46-53`, `apps/api/src/middleware/requestContext.ts:29-43`.
**Files likely touched:** `apps/api/test/projects.test.ts`.
**Implementation plan:** Query viewer by email with Prisma, send `x-user-id`, PATCH issue.
**Illustrative fake-code shape:**
```ts
// Illustrative fake code: adapt to the repo.
.set("x-user-id", viewer.id)
```
**What could go wrong:** Missing seed data.
**Suggested checks:** `npm run db:seed`, API tests.
**Review questions:** Does the test prove role guard, not missing issue?

## Ticket 5: Add Save Error UI State
**Difficulty:** Medium
**Estimated time:** 1-2 hours
**Skills practiced:** React state, error UX.
**Story:** As a user, I want to know when an issue update fails.
**Acceptance criteria:** Issue panel shows a concise save error on failed `onChange`.
**Read these anchors first:** `apps/web/src/App.tsx:252-260`, `apps/web/src/App.tsx:328-335`.
**Files likely touched:** `apps/web/src/App.tsx`, maybe CSS.
**Implementation plan:** Add local error state in `IssuePanel`, set in catch, clear before save.
**Illustrative fake-code shape:**
```tsx
// Illustrative fake code: adapt to the repo.
catch (error) { setSaveError(error instanceof Error ? error.message : "Unable to save"); }
```
**What could go wrong:** Error persists after selecting a new issue.
**Suggested checks:** `npm run build`, manual failed API test.
**Review questions:** Is error visible but not noisy?

## Ticket 6: Add Board Empty State
**Difficulty:** Easy
**Estimated time:** 1 hour
**Skills practiced:** Conditional rendering.
**Story:** As a user, I want empty columns to feel intentional.
**Acceptance criteria:** Empty column shows a neutral empty message.
**Read these anchors first:** `apps/web/src/App.tsx:170-186`.
**Files likely touched:** `apps/web/src/App.tsx`, `apps/web/src/styles/global.css`.
**Implementation plan:** Render message when `issues.length === 0`.
**Fake-code shape:** `// Illustrative fake code: {issues.length === 0 ? <p>...</p> : issues.map(...)}`
**What could go wrong:** Layout shifts.
**Suggested checks:** `npm run build`, visual check.
**Review questions:** Does the text fit mobile?

## Ticket 7: Add Audit Endpoint Test
**Difficulty:** Medium
**Estimated time:** 1 hour
**Skills practiced:** Protected route testing.
**Story:** As a project manager, I want audit endpoint behavior covered.
**Acceptance criteria:** `GET /api/audit` returns an array for project manager.
**Read these anchors first:** `apps/api/src/routes/projects.ts:222-237`, `apps/api/prisma/seed.ts:183-191`.
**Files likely touched:** `apps/api/test/projects.test.ts`.
**Implementation plan:** Query Alex, set `x-user-id`, call endpoint.
**What could go wrong:** Default actor masks missing header.
**Suggested checks:** API tests.
**Review questions:** Is authorization explicit?

## Ticket 8: Add API Error Code Type
**Difficulty:** Medium
**Estimated time:** 1-2 hours
**Skills practiced:** Shared contracts, error modeling.
**Story:** As a client developer, I want typed API error codes.
**Acceptance criteria:** Shared error schema exists and client uses it best-effort.
**Read these anchors first:** `apps/api/src/app.ts:30-42`, `apps/web/src/lib/api.ts:22-28`.
**Files likely touched:** `packages/shared/src/index.ts`, `apps/web/src/lib/api.ts`.
**Implementation plan:** Add `apiErrorSchema`, parse error payload safely.
**What could go wrong:** Breaking existing error handling.
**Suggested checks:** build, API tests.
**Review questions:** Is unknown error payload handled?

## Ticket 9: Add README Note About Disk Space
**Difficulty:** Easy
**Estimated time:** 20 minutes
**Skills practiced:** Developer docs.
**Story:** As a contributor, I want to know Prisma/npm install needs free disk space.
**Acceptance criteria:** README troubleshooting note exists.
**Read these anchors first:** `README.md:7-17`.
**Files likely touched:** `README.md`.
**Implementation plan:** Add short troubleshooting section.
**What could go wrong:** Over-describing local machine details.
**Suggested checks:** Markdown review.
**Review questions:** Is note general and useful?

## Ticket 10: Add Missing Permission Checklist To README
**Difficulty:** Easy
**Estimated time:** 30 minutes
**Skills practiced:** Security documentation.
**Story:** As a learner, I want demo auth limitations clear.
**Acceptance criteria:** README states `x-user-id`/default actor is not production auth.
**Read these anchors first:** `apps/api/src/middleware/requestContext.ts:15-24`, `README.md:19-29`.
**Files likely touched:** `README.md`.
**Implementation plan:** Add "Security note" section.
**What could go wrong:** Making it sound unusable rather than educational.
**Suggested checks:** Markdown review.
**Review questions:** Does it distinguish auth from role checks?

## Ticket 11: Add Health Command To Cheatsheet
**Difficulty:** Easy
**Estimated time:** 15 minutes
**Skills practiced:** Docs maintenance.
**Story:** As a developer, I want a curl/PowerShell command for health checks.
**Acceptance criteria:** Command documented.
**Read these anchors first:** `apps/api/src/routes/health.ts:6-13`.
**Files likely touched:** `docs/upskill/08-reference/command-cheatsheet.md`.
**Implementation plan:** Add command under API checks.
**What could go wrong:** Marking unverified if not run.
**Suggested checks:** Try command locally after reinstall.
**Review questions:** Is verified/inferred label accurate?

## Ticket 12: Improve Client Non-JSON Error Handling
**Difficulty:** Medium
**Estimated time:** 1-2 hours
**Skills practiced:** Defensive client code.
**Story:** As a user, I want useful errors even if server returns non-JSON.
**Acceptance criteria:** `request` handles JSON parse failure gracefully.
**Read these anchors first:** `apps/web/src/lib/api.ts:22-28`.
**Files likely touched:** `apps/web/src/lib/api.ts`.
**Implementation plan:** Read text or wrap JSON parse in try/catch.
**What could go wrong:** Parsing success payload twice.
**Suggested checks:** build; mock fetch test if UI test tooling added.
**Review questions:** Does success schema parsing remain intact?

## Ticket 13: Add WIP Limit Tooltip Or Label
**Difficulty:** Easy
**Estimated time:** 1 hour
**Skills practiced:** UI accessibility.
**Story:** As a user, I want to understand the number in a column header.
**Acceptance criteria:** WIP limit has accessible label/title.
**Read these anchors first:** `apps/web/src/App.tsx:174-180`.
**Files likely touched:** `apps/web/src/App.tsx`.
**Implementation plan:** Add `aria-label` or `title`.
**What could go wrong:** Text overflow.
**Suggested checks:** build, visual check.
**Review questions:** Is the label meaningful to screen readers?

## Ticket 14: Add Issue Create API Test
**Difficulty:** Medium
**Estimated time:** 1-2 hours
**Skills practiced:** POST testing, generated keys.
**Story:** As a maintainer, I want create issue behavior covered.
**Acceptance criteria:** POST creates issue with next key and reporter.
**Read these anchors first:** `apps/api/src/routes/projects.ts:129-180`, `packages/shared/src/index.ts:80-88`.
**Files likely touched:** `apps/api/test/projects.test.ts`.
**Implementation plan:** Get project id, POST minimal valid body, assert 201.
**What could go wrong:** Test mutates shared seed state.
**Suggested checks:** Reseed before tests or isolate.
**Review questions:** Is cleanup needed?

## Ticket 15: Add CSS Mobile Smoke Notes
**Difficulty:** Easy
**Estimated time:** 45 minutes
**Skills practiced:** Responsive reading.
**Story:** As a frontend contributor, I want known responsive breakpoints documented.
**Acceptance criteria:** Docs mention mobile breakpoints in CSS.
**Read these anchors first:** `apps/web/src/styles/global.css` and `apps/web/src/App.tsx:103-197`.
**Files likely touched:** docs only.
**Implementation plan:** Add short UI notes to cartography or README.
**What could go wrong:** Claiming visual verification not performed.
**Suggested checks:** Browser check when available.
**Review questions:** Are uncertainties labeled?

## Ticket 16: Add Request Id TODO Comment In Observability Docs
**Difficulty:** Easy
**Estimated time:** 20 minutes
**Skills practiced:** Operations thinking.
**Story:** As an operator, I want a documented next step for correlating logs.
**Acceptance criteria:** Observability docs include request id recommendation.
**Read these anchors first:** `apps/api/src/app.ts:17`, `apps/api/src/app.ts:41`.
**Files likely touched:** docs only.
**Implementation plan:** Add note under observability.
**What could go wrong:** Turning docs ticket into product refactor.
**Suggested checks:** Markdown review.
**Review questions:** Does it explain value and risk?
