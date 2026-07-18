# 02 File Reading Order

## Junior Path

| Order | File | Why it matters | Look for | Do not get distracted by |
| --- | --- | --- | --- | --- |
| 1 | `README.md:1-17` | Product and quick start. | Goal, URLs. | Roadmap items. |
| 2 | `package.json:7-19` | Workspace commands. | `dev`, `build`, `test`, DB scripts. | Dependency versions. |
| 3 | `packages/shared/src/index.ts:3-15` | Core enums and user shape. | Status, priority, role. | Zod syntax trivia. |
| 4 | `packages/shared/src/index.ts:17-67` | API response schemas. | Project, issue, board payload. | Branded type ideas. |
| 5 | `apps/web/src/lib/api.ts:11-44` | HTTP client. | Fetch, error, schema parse. | React Query yet. |
| 6 | `apps/web/src/App.tsx:21-80` | Main state and effects. | Loading projects and board. | Styling classes. |
| 7 | `apps/web/src/App.tsx:159-193` | Board render. | Column grouping and issue cards. | Drag-and-drop behavior. |
| 8 | `apps/api/src/app.ts:14-21` | Middleware and routes. | Helmet, CORS, JSON, actor, routers. | Express internals. |
| 9 | `apps/api/src/routes/projects.ts:54-127` | Read endpoints. | Prisma includes and response mapping. | Query optimization at first. |
| 10 | `apps/api/test/projects.test.ts:15-34` | Test style. | Supertest request/expect. | Test isolation redesign. |

## Mid-Level Path

| Order | File | Why it matters | Look for | Do not get distracted by |
| --- | --- | --- | --- | --- |
| 1 | `apps/api/src/middleware/requestContext.ts:15-43` | Permission boundary. | Demo actor and role guard. | Full SSO design. |
| 2 | `apps/api/src/routes/projects.ts:129-218` | Write endpoints. | Validation, authorization, DB write, audit event. | Bulk update features. |
| 3 | `apps/api/prisma/schema.prisma:10-93` | Data model. | Relationships and cascade rules. | Full migration tooling. |
| 4 | `apps/api/prisma/bootstrap.ts:5-97` | Local DB bootstrap. | Raw SQL mirrors schema. | Treating it as ideal production migration. |
| 5 | `apps/api/prisma/seed.ts:13-191` | Demo data. | Domain examples, issue distribution. | Avatar URLs. |
| 6 | `apps/web/src/App.tsx:82-99` | Local mutation update. | Replace updated issue and recompute done count. | Optimistic framework choices. |
| 7 | `apps/web/src/App.tsx:228-317` | Issue panel. | Form controls and save function. | Styling. |
| 8 | `apps/api/src/app.ts:27-45` | Error translation. | Zod 400 vs generic 500. | Custom error hierarchy. |
| 9 | `apps/api/src/routes/health.ts:6-13` | Operational probe. | DB query and timestamp. | Metrics not present yet. |
| 10 | `docker-compose.yml:1-27` | Deployment shape. | API/web services and volume. | Production orchestration. |

## Senior Path

| Order | File | Senior questions |
| --- | --- | --- |
| 1 | `packages/shared/src/index.ts:3-101` | Which fields are public commitments? |
| 2 | `apps/api/src/routes/projects.ts:24-52` | Are DB strings safely narrowed? |
| 3 | `apps/api/src/routes/projects.ts:54-127` | What is the latency and N+1 risk as data grows? |
| 4 | `apps/api/src/routes/projects.ts:129-218` | What invariants need transactions? |
| 5 | `apps/api/src/middleware/requestContext.ts:15-43` | Where would tenant isolation and sessions belong? |
| 6 | `apps/api/prisma/schema.prisma:10-93` | What indexes and constraints are missing? |
| 7 | `apps/api/prisma/bootstrap.ts:5-97` | How would this evolve to migrations? |
| 8 | `apps/web/src/App.tsx:21-99` | Where will state/caching break as app grows? |
| 9 | `apps/web/src/lib/api.ts:13-29` | How should network and auth errors be represented? |
| 10 | `apps/api/test/projects.test.ts:1-34` | What behaviors are untested and highest risk? |

## Drill

Read one path in each level. For every file, write one invariant. Example: `Issue.status` should be one of shared `issueStatusSchema` values (`packages/shared/src/index.ts:3`, narrowed in `apps/api/src/routes/projects.ts:35`).
