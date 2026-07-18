# 03 Systematic Debugging

Method:

1. Reproduce.
2. Narrow layer.
3. Form a hypothesis.
4. Test cheaply.
5. Fix root cause.
6. Add regression coverage.

## Scenario: Board Shows Loading Forever

**Reproduction:** Open web app; loading row remains.
**First question:** Is the bug in UI fetch or API response?
**Narrowing path:**
1. Call `GET /api/projects/ATLAS/board`.
2. If 200, inspect `apps/web/src/lib/api.ts:22-28` for parse error.
3. If API fails, inspect `apps/api/src/routes/projects.ts:78-127`.
**Useful probes:** Browser network panel, API logs from Morgan (`apps/api/src/app.ts:17`).
**Likely root causes:** invalid DB enum string, API down, CORS mismatch.
**Regression test to add:** API board schema parse or UI error state.
**Senior lesson:** Separate transport failure from contract failure.

## Scenario: PATCH Returns 400

**Reproduction:** Change story points to invalid value.
**First question:** Is client sending bad shape or server schema too strict?
**Narrowing path:** Inspect request body, then `updateIssueSchema` (`packages/shared/src/index.ts:69-78`), then Zod error handler (`apps/api/src/app.ts:30-39`).
**Useful probes:** Supertest validation test (`apps/api/test/projects.test.ts:28-33`).
**Likely root causes:** status not in enum, story points above 100, invalid date.
**Regression test to add:** Specific invalid field test.
**Senior lesson:** 400s are often healthy boundaries, not bugs.

## Scenario: Viewer Can Update Issue

**Reproduction:** Send PATCH with seeded viewer id.
**First question:** Did `attachActor` attach the viewer?
**Narrowing path:** Query seeded users (`apps/api/prisma/seed.ts:46-53`), set `x-user-id`, inspect `requireRole` (`apps/api/src/middleware/requestContext.ts:29-43`).
**Likely root causes:** wrong user id, actor defaulted to project manager, route missing guard.
**Regression test to add:** viewer PATCH -> 403.
**Senior lesson:** Auth tests must control identity explicitly.

## Scenario: Audit Event Missing

**Reproduction:** Successful issue update but no audit row.
**First question:** Did update happen and audit fail, or was route not reached?
**Narrowing path:** Inspect route lines `apps/api/src/routes/projects.ts:196-216`; query audit table.
**Likely root causes:** audit insert failed after update, test checks wrong entity id.
**Regression test to add:** update creates audit event.
**Senior lesson:** Multi-write flows need transaction or compensation.

## Scenario: Docker API Starts But Web Cannot Reach It

**Reproduction:** `docker compose up`, web loads but API calls fail.
**First question:** Is browser trying `localhost:4000` from host or container?
**Narrowing path:** Inspect web build arg `docker-compose.yml:19-20`, API CORS `docker-compose.yml:6-9`, `apps/api/src/app.ts:15`.
**Likely root causes:** wrong `VITE_API_URL`, CORS origin mismatch.
**Regression test to add:** documented smoke test.
**Senior lesson:** Build-time browser env and server CORS must agree.
