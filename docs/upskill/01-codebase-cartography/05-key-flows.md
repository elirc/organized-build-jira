# 05 Key Flows

## Flow: Portfolio Load

**Why this flow matters:** It is the first API/UI contract most users experience. It teaches fetch, validation, Prisma reads, and response mapping.

**Open these files first:**

- `apps/web/src/App.tsx:30-49` - loads portfolio.
- `apps/web/src/lib/api.ts:31-33` - fetches `/api/projects`.
- `apps/api/src/routes/projects.ts:54-76` - reads and maps projects.
- `packages/shared/src/index.ts:17-27` - project summary contract.

**Trace:**

| Step | Owner | File | What happens | Data shape | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | UI | `apps/web/src/App.tsx:30-49` | Effect calls `getProjects`. | none -> `ProjectSummary[]` | Effect only runs once; stale if server changes. |
| 2 | Client API | `apps/web/src/lib/api.ts:13-29` | Fetches JSON and parses schema. | unknown JSON -> typed data | `response.json()` assumes JSON even on non-JSON errors. |
| 3 | Server | `apps/api/src/routes/projects.ts:54-61` | Prisma reads projects, lead, issue statuses. | DB rows | Counts load all statuses into memory. |
| 4 | Server | `apps/api/src/routes/projects.ts:63-75` | Maps DB rows to public shape. | Prisma result -> contract | Contract drift if mapper not tested deeply. |
| 5 | UI | `apps/web/src/App.tsx:36-39` | Stores projects and selects a key. | `ProjectSummary[]` | Empty project list fallback is implicit. |

**Validation and authorization:** No explicit role check on `GET /projects`; all users can read. Client validates response at `apps/web/src/lib/api.ts:31-33`.

**Persistence and side effects:** Uses Prisma `findMany` only; no write side effect (`apps/api/src/routes/projects.ts:55-61`).

**Tests that cover it:** `apps/api/test/projects.test.ts:16-20`.

**What juniors usually miss:**

- Client schema parsing is validation too (`apps/web/src/lib/api.ts:28`).
- `doneCount` is computed from loaded statuses, not stored (`apps/api/src/routes/projects.ts:71-72`).

**What seniors notice:**

- Loading issue statuses for counts has scaling risk.
- No pagination or tenant boundary exists.

**Drill:** Add a trace note for what happens if `/api/projects` returns invalid `health`.

**Self-grade:**

- Basic: identifies UI and API files.
- Solid: explains DB -> DTO mapping.
- Strong: identifies count scaling and missing isolation risk.

## Flow: Board Load

**Why this flow matters:** It is the central product surface: project details, workflow columns, issues, team, and sprint.

**Open these files first:**

- `apps/web/src/App.tsx:51-74` - loads board for selected project.
- `apps/api/src/routes/projects.ts:78-127` - board endpoint.
- `packages/shared/src/index.ts:53-67` - board response contract.
- `apps/web/src/App.tsx:159-193` - renders board.

**Trace:**

| Step | Owner | File | What happens | Data shape | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | UI | `apps/web/src/App.tsx:51-74` | Effect runs when selected project key changes. | `selectedProjectKey` | Rapid changes can race; no request cancellation. |
| 2 | Client | `apps/web/src/lib/api.ts:35-37` | Calls board endpoint and parses response. | unknown JSON -> `BoardResponse` | Invalid server data becomes client error. |
| 3 | API | `apps/api/src/routes/projects.ts:79-93` | Finds project by key with columns, issues, sprint. | Prisma include graph | `req.params.key` assumed present. |
| 4 | API | `apps/api/src/routes/projects.ts:95-98` | 404 if not found. | error JSON | No specific 404 UI. |
| 5 | API | `apps/api/src/routes/projects.ts:102-126` | Maps project board payload. | DB graph -> DTO | Mapper uses narrowing helpers. |
| 6 | UI | `apps/web/src/App.tsx:170-190` | Groups issues by column status during render. | `Issue[]` | Refiltering per column can grow costly. |

**Validation and authorization:** Response validation is client-side. No role guard on read.

**Persistence and side effects:** Read-only Prisma query with nested includes (`apps/api/src/routes/projects.ts:79-93`).

**Tests that cover it:** `apps/api/test/projects.test.ts:22-26`.

**What juniors usually miss:** Board columns come from DB seed, not hardcoded UI (`apps/api/prisma/seed.ts:5-11`, `apps/web/src/App.tsx:170-180`).

**What seniors notice:** No access control filters by project membership; future multi-tenant support must change the query boundary.

**Drill:** Draw the payload shape from `boardResponseSchema` and mark arrays.

**Self-grade:**

- Basic: can call the endpoint.
- Solid: maps every UI region to a response field.
- Strong: proposes cancellation/cache strategy and permission filter.

## Flow: Issue Update

**Why this flow matters:** It crosses UI form state, client transport, server validation, role authorization, persistence, audit side effect, and UI reconciliation.

**Open these files first:**

- `apps/web/src/App.tsx:252-314` - form controls call `save`.
- `apps/web/src/App.tsx:82-99` - updates board state after response.
- `apps/web/src/lib/api.ts:39-44` - PATCH client.
- `apps/api/src/routes/projects.ts:183-218` - server write.
- `packages/shared/src/index.ts:69-78` - input contract.

**Trace:**

| Step | Owner | File | What happens | Data shape | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | UI | `apps/web/src/App.tsx:271-314` | Select/input creates partial update. | `UpdateIssueInput` | Numeric input sends `Number("")` as `0`. |
| 2 | UI | `apps/web/src/App.tsx:252-260` | Sets saving state and awaits mutation. | partial update | No visible error if save fails. |
| 3 | Client | `apps/web/src/lib/api.ts:39-44` | PATCHes JSON body. | JSON | No user header; server defaults actor. |
| 4 | API | `apps/api/src/routes/projects.ts:183-187` | Role guard then Zod parse. | unknown -> `UpdateIssueInput` | Validation is route-level, not DB-level. |
| 5 | API | `apps/api/src/routes/projects.ts:190-206` | Finds and updates issue. | DB row -> updated row | No project membership check. |
| 6 | API | `apps/api/src/routes/projects.ts:208-216` | Writes audit event. | JSON string metadata | Not transactional with issue update. |
| 7 | UI | `apps/web/src/App.tsx:84-99` | Replaces issue and recomputes done count. | updated issue | Other derived counts can drift if added later. |

**Validation and authorization:** `updateIssueSchema` validates input (`packages/shared/src/index.ts:69-78`). `requireRole` allows admin/project manager/engineer (`apps/api/src/routes/projects.ts:183-185`, `apps/api/src/middleware/requestContext.ts:29-43`).

**Persistence and side effects:** Issue update and audit insert are separate operations (`apps/api/src/routes/projects.ts:196-216`).

**Tests that cover it:** Validation failure is covered (`apps/api/test/projects.test.ts:28-33`). Happy-path update and audit write are not directly covered.

**What juniors usually miss:** Permission check is not authentication. The actor comes from a header or first user (`apps/api/src/middleware/requestContext.ts:15-24`).

**What seniors notice:** Audit event can fail after the issue update, leaving inconsistent audit history. Consider a transaction.

**Drill:** Write a test plan for status update happy path and audit event creation.

**Self-grade:**

- Basic: finds the PATCH route.
- Solid: names validation and authorization boundaries.
- Strong: identifies transaction and IDOR risks.

## Flow: Issue Create

**Why this flow matters:** It shows key generation, rank calculation, reporter assignment, and audit side effects.

**Open these files first:**

- `packages/shared/src/index.ts:80-88` - create input.
- `apps/api/src/routes/projects.ts:129-180` - create route.
- `apps/api/prisma/schema.prisma:61-82` - issue model.

**Trace:**

| Step | Owner | File | What happens | Data shape | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | API | `apps/api/src/routes/projects.ts:129-133` | Role guard then parse input. | unknown -> create input | No UI currently calls this route. |
| 2 | API | `apps/api/src/routes/projects.ts:134-142` | Loads project and existing issue keys/ranks. | project + issues | Concurrent creates can choose same next key. |
| 3 | API | `apps/api/src/routes/projects.ts:144-148` | Computes next numeric suffix. | strings -> number | Assumes key format stays `PROJECT-N`. |
| 4 | API | `apps/api/src/routes/projects.ts:150-167` | Creates issue with actor as reporter. | DB row | No sprint assignment by default. |
| 5 | API | `apps/api/src/routes/projects.ts:169-179` | Audit event then response. | issue DTO | Audit not transactional. |

**Validation and authorization:** `createIssueSchema` validates title/type/priority/story points (`packages/shared/src/index.ts:80-88`). `requireRole` protects route (`apps/api/src/routes/projects.ts:129-132`).

**Persistence and side effects:** One issue insert and one audit insert.

**Tests that cover it:** No direct test found.

**What juniors usually miss:** Key generation is application logic, not a DB sequence.

**What seniors notice:** Key generation needs transaction/unique retry under concurrency.

**Drill:** Design a test that creates two issues and asserts keys increment.

**Self-grade:**

- Basic: can create request body.
- Solid: explains key and rank calculation.
- Strong: proposes concurrency-safe design.

## Flow: Request Actor And Permission Check

**Why this flow matters:** It is the current security boundary and the most important "demo vs production" distinction.

**Open these files first:**

- `apps/api/src/app.ts:18` - attaches actor middleware globally.
- `apps/api/src/middleware/requestContext.ts:15-27` - chooses actor.
- `apps/api/src/middleware/requestContext.ts:29-43` - role guard.
- `apps/api/src/routes/projects.ts:129-132`, `apps/api/src/routes/projects.ts:183-185`, `apps/api/src/routes/projects.ts:222-237` - protected routes.

**Trace:**

| Step | Owner | File | What happens | Data shape | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | Middleware | `apps/api/src/app.ts:18` | Runs `attachActor` before routes. | request | All requests incur DB lookup. |
| 2 | Middleware | `apps/api/src/middleware/requestContext.ts:15-20` | Uses `x-user-id` or first user. | header -> user | Header is spoofable. |
| 3 | Middleware | `apps/api/src/middleware/requestContext.ts:22-24` | Parses role through shared schema. | DB string -> `UserRole` | Bad DB role throws into 500. |
| 4 | Guard | `apps/api/src/middleware/requestContext.ts:29-43` | Checks allowed roles. | actor role | No resource-level permission. |

**Validation and authorization:** Role validation uses shared schema. Authorization is role-only.

**Persistence and side effects:** User lookup on every request.

**Tests that cover it:** No direct permission tests found.

**What juniors usually miss:** `x-user-id` is not secure auth.

**What seniors notice:** Add session auth, tenant/project membership, and explicit 401 behavior when no actor exists.

**Drill:** Write three test cases: no users, viewer PATCH, engineer PATCH.

**Self-grade:**

- Basic: can explain role guard.
- Solid: distinguishes authentication from authorization.
- Strong: designs resource-level isolation.

## Flow: Database Bootstrap And Seed

**Why this flow matters:** Local development depends on reproducible schema and data.

**Open these files first:**

- `apps/api/prisma/schema.prisma:10-93` - model source of truth.
- `apps/api/prisma/bootstrap.ts:5-97` - SQLite table creation.
- `apps/api/prisma/seed.ts:13-191` - demo data.
- `apps/api/package.json:11-13` - DB commands.

**Trace:**

| Step | Owner | File | What happens | Data shape | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | CLI | `apps/api/package.json:11` | Generates Prisma client. | schema -> client | Requires engine binaries and disk space. |
| 2 | CLI | `apps/api/package.json:12` | Runs bootstrap SQL. | SQL tables | Bootstrap can drift from Prisma schema. |
| 3 | Seed | `apps/api/prisma/seed.ts:14-19` | Deletes old data. | tables | Destructive; local-only. |
| 4 | Seed | `apps/api/prisma/seed.ts:21-84` | Creates users, projects, columns. | DB rows | Promise returns an intentionally ignored fourth user. |
| 5 | Seed | `apps/api/prisma/seed.ts:86-191` | Creates sprint, issues, audit event. | demo board | Dates become stale over time. |

**Validation and authorization:** Seed data bypasses HTTP validation; values should still match shared enums.

**Persistence and side effects:** Writes all core tables.

**Tests that cover it:** Tests assume seed data exists and fail if user count is zero (`apps/api/test/projects.test.ts:8-12`).

**What juniors usually miss:** Bootstrap SQL and Prisma schema must be kept synchronized.

**What seniors notice:** Real migrations should replace raw bootstrap for production.

**Drill:** Compare `Issue` columns in Prisma and bootstrap SQL; list mismatches.

**Self-grade:**

- Basic: can seed DB.
- Solid: understands destructive seed behavior.
- Strong: proposes migration verification.

## Flow: Error Translation

**Why this flow matters:** Good APIs expose stable error shapes and avoid leaking internals.

**Open these files first:**

- `apps/api/src/app.ts:23-45` - 404 and error handler.
- `apps/api/src/routes/projects.ts:95-98`, `apps/api/src/routes/projects.ts:139-142`, `apps/api/src/routes/projects.ts:190-193` - route-level 404s.
- `apps/web/src/lib/api.ts:22-28` - client error handling.

**Trace:**

| Step | Owner | File | What happens | Data shape | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | API | `apps/api/src/routes/projects.ts:95-98` | Missing project becomes 404 JSON. | error object | Client displays generic error row. |
| 2 | API | `apps/api/src/app.ts:30-39` | Zod errors become 400 JSON. | flattened Zod details | Details may be too verbose for public API. |
| 3 | API | `apps/api/src/app.ts:41-42` | Unknown errors log and become 500. | generic JSON | Console logging only; no structured telemetry. |
| 4 | Client | `apps/web/src/lib/api.ts:22-28` | Throws message on non-OK or parses success. | JSON -> Error/typed data | Non-JSON error response would throw before `response.ok`. |

**Validation and authorization:** Validation errors are centralized for Zod. Authorization errors are returned inside `requireRole` (`apps/api/src/middleware/requestContext.ts:31-38`).

**Persistence and side effects:** None directly.

**Tests that cover it:** Validation 400 covered (`apps/api/test/projects.test.ts:28-33`). 404, 401, 403, 500 not directly covered.

**What juniors usually miss:** Throwing an Error in the client loses structured error details.

**What seniors notice:** Introduce typed API error model, correlation IDs, and logging context.

**Drill:** Create a trace for invalid `storyPoints` and include status code, response body, and UI behavior.

**Self-grade:**

- Basic: finds error handler.
- Solid: distinguishes 400/404/500.
- Strong: proposes stable error contract and observability.

## Flow: Health Check

**Why this flow matters:** Operations need a cheap signal that the server and database are alive.

**Open these files first:**

- `apps/api/src/routes/health.ts:6-13` - health route.
- `apps/api/src/app.ts:20` - route mounted.
- `apps/api/src/lib/prisma.ts:1-5` - Prisma client.

**Trace:**

| Step | Owner | File | What happens | Data shape | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | Ops/client | `apps/api/src/routes/health.ts:6` | GET `/health`. | none | No auth; appropriate for basic health. |
| 2 | API | `apps/api/src/routes/health.ts:7` | Runs `SELECT 1`. | DB probe | Fails if DB unavailable. |
| 3 | API | `apps/api/src/routes/health.ts:8-12` | Returns status and timestamp. | JSON | No readiness vs liveness distinction. |

**Validation and authorization:** None.

**Persistence and side effects:** Read-only DB probe.

**Tests that cover it:** No direct health test found.

**What juniors usually miss:** Health check is both an app and dependency check because it queries DB.

**What seniors notice:** Production usually separates liveness from readiness and includes timeout behavior.

**Drill:** Add a health API test with Supertest.

**Self-grade:**

- Basic: can call endpoint.
- Solid: explains DB dependency.
- Strong: designs readiness/liveness split.
