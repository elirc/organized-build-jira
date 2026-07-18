# 05 Pattern Catalog

## Pattern: Shared Runtime Contract
**Problem it solves:** Client and server can drift on JSON shape.
**General shape:** Define schemas once; import them in both runtimes.
**Real example:** `packages/shared/src/index.ts:17-88`
**Second example:** Client parser at `apps/web/src/lib/api.ts:28`
**Why this implementation works:** Zod gives runtime validation and inferred TS types.
**Failure modes:** Schema changes can become breaking API changes.
**Use it when:** Data crosses process/runtime boundaries.
**Avoid it when:** Data is private inside one function.
**Drill:** Trace `storyPoints` from schema to UI input.

## Pattern: Request Middleware Pipeline
**Problem it solves:** Cross-cutting HTTP concerns stay out of route handlers.
**General shape:** Register security, parsing, logging, context, routes, errors.
**Real example:** `apps/api/src/app.ts:14-21`
**Second example:** Error handler at `apps/api/src/app.ts:27-45`
**Failure modes:** Wrong order breaks auth/error handling.
**Use it when:** Behavior applies to many routes.
**Avoid it when:** Logic is resource-specific.
**Drill:** Move `attachActor` after routes mentally and predict write behavior.

## Pattern: Narrowed DB Projection
**Problem it solves:** Avoid over-returning DB fields.
**General shape:** Define a reusable select object.
**Real example:** `apps/api/src/routes/projects.ts:16-22`
**Second example:** Assignee/reporter includes at `apps/api/src/routes/projects.ts:86-89`
**Failure modes:** New sensitive fields can leak if broad includes are used elsewhere.
**Use it when:** Returning related user data.
**Avoid it when:** Internal-only code needs full model.
**Drill:** Add a fake `passwordHash` and prove it is not selected.

## Pattern: DTO Mapper
**Problem it solves:** DB models do not equal public API shapes.
**General shape:** Convert DB values to contract values at route boundary.
**Real example:** `apps/api/src/routes/projects.ts:24-52`
**Second example:** Project summary mapping at `apps/api/src/routes/projects.ts:63-75`
**Failure modes:** Mapper grows too complex inside route file.
**Use it when:** Dates, enum-like strings, or relations need shaping.
**Avoid it when:** Returning raw DB rows would be a public contract leak.
**Drill:** Identify every date converted to ISO string.

## Pattern: Route-Level Validation
**Problem it solves:** Reject invalid input before mutation.
**General shape:** Parse `req.body` with schema at route entry.
**Real example:** `apps/api/src/routes/projects.ts:133`
**Second example:** `apps/api/src/routes/projects.ts:187`
**Failure modes:** DB writes outside routes bypass validation.
**Use it when:** Accepting HTTP input.
**Avoid it when:** Data is already trusted and parsed.
**Drill:** Create a bad update body and locate the 400 path.

## Pattern: Role Guard Factory
**Problem it solves:** Reuse authorization checks.
**General shape:** Function takes allowed roles and returns middleware.
**Real example:** `apps/api/src/middleware/requestContext.ts:29-43`
**Second example:** `apps/api/src/routes/projects.ts:183-185`
**Failure modes:** Role-only checks miss resource ownership.
**Use it when:** Route-level role permissions are enough.
**Avoid it when:** You need project membership or tenant checks.
**Drill:** Add a fake route and choose allowed roles.

## Pattern: Typed Fetch Wrapper
**Problem it solves:** Avoid hand-writing fetch/error/parse logic per endpoint.
**General shape:** Generic request function accepts path and schema.
**Real example:** `apps/web/src/lib/api.ts:13-29`
**Second example:** `apps/web/src/lib/api.ts:31-44`
**Failure modes:** Assumes JSON for every response.
**Use it when:** REST endpoints share conventions.
**Avoid it when:** Streaming/download endpoints need different handling.
**Drill:** Extend it to preserve error code.

## Pattern: Derived UI State
**Problem it solves:** Avoid storing duplicate values that can be computed.
**General shape:** Compute filtered/grouped data from state.
**Real example:** `apps/web/src/App.tsx:76-80`
**Second example:** Done count recompute at `apps/web/src/App.tsx:91-95`
**Failure modes:** Expensive derived work during render.
**Use it when:** Computation is cheap and deterministic.
**Avoid it when:** Derivation is expensive or async.
**Drill:** Group issues by status once with `useMemo`.

## Pattern: Selected Entity Panel
**Problem it solves:** Keep list and detail editing in one workflow.
**General shape:** Store selected entity id/object and render detail panel.
**Real example:** `apps/web/src/App.tsx:26`, `apps/web/src/App.tsx:192`
**Second example:** `apps/web/src/App.tsx:228-317`
**Failure modes:** Selected object can become stale after list refresh.
**Use it when:** Editing one item from a board/list.
**Avoid it when:** Deep-linkable detail routes are required.
**Drill:** Explain what happens to selected issue after board reload.

## Pattern: Health Probe
**Problem it solves:** External systems need to know if service is alive.
**General shape:** Cheap endpoint returns status and dependency signal.
**Real example:** `apps/api/src/routes/health.ts:6-13`
**Second example:** Route mount at `apps/api/src/app.ts:20`
**Failure modes:** Mixing liveness and readiness can cause bad restarts.
**Use it when:** Running a service.
**Avoid it when:** It exposes sensitive internals.
**Drill:** Split liveness and readiness endpoints.

## Pattern: Seeded Demo Data
**Problem it solves:** Local app needs realistic data quickly.
**General shape:** Clear tables, create users/projects/columns/issues.
**Real example:** `apps/api/prisma/seed.ts:13-191`
**Second example:** Tests depend on user count at `apps/api/test/projects.test.ts:8-12`
**Failure modes:** Tests become order/data dependent.
**Use it when:** Onboarding and demos.
**Avoid it when:** Test isolation requires fresh fixtures per test.
**Drill:** Add a seed issue that exercises `OFF_TRACK`.

## Pattern: API Error Translation
**Problem it solves:** Internal exceptions become stable HTTP responses.
**General shape:** Catch validation errors specially, hide unknown internals.
**Real example:** `apps/api/src/app.ts:27-45`
**Second example:** Route 404s at `apps/api/src/routes/projects.ts:95-98`
**Failure modes:** Logs lack context; client loses structured details.
**Use it when:** Exposing HTTP APIs.
**Avoid it when:** You need domain-specific error classes but have not modeled them.
**Drill:** Add a typed `FORBIDDEN` test.

## Pattern: Prisma Include Graph
**Problem it solves:** Load related data in one route query.
**General shape:** `findUnique/findMany` with selected nested relations.
**Real example:** `apps/api/src/routes/projects.ts:79-93`
**Second example:** `apps/api/src/routes/projects.ts:55-60`
**Failure modes:** Large include graphs can overfetch.
**Use it when:** Response needs related data now.
**Avoid it when:** Response should be paginated or streamed.
**Drill:** Identify fields loaded but not rendered.

## Pattern: Bootstrap Script
**Problem it solves:** Local DB can be initialized without migrations working.
**General shape:** Execute static SQL to create tables.
**Real example:** `apps/api/prisma/bootstrap.ts:5-97`
**Second example:** Command script at `apps/api/package.json:12`
**Failure modes:** Drift from Prisma schema.
**Use it when:** Local practice app needs a pragmatic fallback.
**Avoid it when:** Production migrations matter.
**Drill:** Compare `AuditEvent.metadata` in schema and SQL.

## Pattern: Focused API Tests
**Problem it solves:** Verify route behavior without browser automation.
**General shape:** Supertest app requests with Vitest assertions.
**Real example:** `apps/api/test/projects.test.ts:15-34`
**Second example:** App factory at `apps/api/src/app.ts:11-47`
**Failure modes:** Tests depend on seeded DB and miss isolation.
**Use it when:** Testing HTTP contracts and validation.
**Avoid it when:** UI behavior is the thing under test.
**Drill:** Add health and permission tests.
