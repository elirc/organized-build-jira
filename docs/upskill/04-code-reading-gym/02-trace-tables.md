# 02 Trace Tables

## UI-To-API Trace: Status Update

| Step | File/line | Value shape | Owner | Transformation | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | `apps/web/src/App.tsx:273` | string select value | UI | cast to `IssueStatus` | Cast may hide invalid value. |
| 2 | `apps/web/src/App.tsx:252-260` | `{ status }` | UI | calls `onChange` | Save errors not surfaced. |
| 3 | `apps/web/src/lib/api.ts:39-44` | JSON body | client API | PATCH request | No auth header. |
| 4 | `apps/api/src/routes/projects.ts:187` | unknown body | API | Zod parse | Invalid status -> 400. |
| 5 | `apps/api/src/routes/projects.ts:196-206` | Prisma update | persistence | DB row changed | No resource membership check. |
| 6 | `apps/api/src/routes/projects.ts:208-216` | audit metadata | side effect | audit insert | Not transactional. |
| 7 | `apps/web/src/App.tsx:84-99` | updated issue | UI | replace and recompute | Derived state can drift. |

## Persistence Trace: Seed Issue

| Step | File/line | Value shape | Owner | Transformation | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | `apps/api/prisma/seed.ts:96-180` | issue literals | seed | createMany | Bypasses HTTP validation. |
| 2 | `apps/api/prisma/schema.prisma:61-82` | Issue row | DB | constraints/relations | Status not DB enum. |
| 3 | `apps/api/src/routes/projects.ts:84-89` | issue relations | API | include assignee/reporter | Overfetch as app grows. |
| 4 | `apps/api/src/routes/projects.ts:115` | issue DTO | API | `toIso` mapper | Parser throws if bad strings. |
| 5 | `apps/web/src/App.tsx:183-184` | Issue card props | UI | render card | Missing fields break UI contract. |

## Auth/Permission Trace: Protected PATCH

| Step | File/line | Value shape | Owner | Transformation | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | `apps/api/src/app.ts:18` | request | middleware | attach actor | DB lookup per request. |
| 2 | `apps/api/src/middleware/requestContext.ts:15-20` | header/default | middleware | find user | Header spoofable. |
| 3 | `apps/api/src/middleware/requestContext.ts:22-24` | DB user | middleware | parse role | Bad role -> error. |
| 4 | `apps/api/src/routes/projects.ts:183-185` | route | API | require role | Role-only. |
| 5 | `apps/api/src/routes/projects.ts:190-197` | issue id | API | update by id | IDOR risk. |

## Error Trace: Invalid Story Points

| Step | File/line | Value shape | Owner | Transformation | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | `apps/api/test/projects.test.ts:28-33` | `{ storyPoints: 1000 }` | test | PATCH | Expects 400. |
| 2 | `packages/shared/src/index.ts:75` | number | schema | max 100 | Good invariant. |
| 3 | `apps/api/src/routes/projects.ts:187` | body | API | parse throws ZodError | Route stops before DB. |
| 4 | `apps/api/src/app.ts:30-39` | ZodError | error middleware | 400 JSON | Details shape may leak internals. |

## Operational Trace: Health

| Step | File/line | Value shape | Owner | Transformation | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | `apps/api/src/routes/health.ts:6` | request | API | route match | No auth. |
| 2 | `apps/api/src/routes/health.ts:7` | SQL probe | Prisma | `SELECT 1` | DB down -> endpoint down. |
| 3 | `apps/api/src/routes/health.ts:8-12` | JSON | API | status response | No liveness/readiness split. |
