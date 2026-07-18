# 00 Fast Track

This is the weekend path. It gives you a working app, two traces, one safe change idea, and a short teach-back.

## Install, Run, Test

Verified commands:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
npm run build
npm run lint
npm run test -w @buildjira/api
```

Why these commands exist:

- Workspace scripts live in `package.json:11-19`.
- API scripts live in `apps/api/package.json:6-13`.
- Web scripts live in `apps/web/package.json:6-9`.
- The README quick start lists the same local setup sequence (`README.md:7-17`).

Local URLs:

- Web: `http://localhost:5173`
- API health: `http://localhost:4000/health`
- Projects API: `http://localhost:4000/api/projects`

## First 10 Files To Open

| Order | File | Why it matters | Do not get distracted by |
| --- | --- | --- | --- |
| 1 | `README.md:1-29` | Product purpose and commands. | Future roadmap details. |
| 2 | `package.json:7-19` | Workspace shape and root scripts. | Package versions. |
| 3 | `packages/shared/src/index.ts:3-101` | Public data contracts. | Zod syntax trivia at first. |
| 4 | `apps/api/src/app.ts:11-47` | Express middleware and router composition. | Morgan format options. |
| 5 | `apps/api/src/routes/projects.ts:54-127` | Portfolio and board reads. | Full Prisma include syntax until you trace data. |
| 6 | `apps/api/src/routes/projects.ts:129-218` | Issue create/update writes and audit events. | Perfecting the API design yet. |
| 7 | `apps/api/src/middleware/requestContext.ts:15-43` | Demo actor and role guard. | Real auth not implemented yet. |
| 8 | `apps/web/src/lib/api.ts:11-44` | Fetch wrapper and client validation. | Styling. |
| 9 | `apps/web/src/App.tsx:21-99` | UI state and data loading. | Icon imports. |
| 10 | `apps/api/test/projects.test.ts:15-34` | Existing API test style. | Test database idealism; it is intentionally simple. |

## Trace 1: Project Board Load

Open these files first:

- `apps/web/src/App.tsx:30-74` - fetches portfolio and board data.
- `apps/web/src/lib/api.ts:31-37` - calls `/api/projects` and `/api/projects/:key/board`.
- `apps/api/src/routes/projects.ts:54-127` - returns project summaries and board payloads.
- `packages/shared/src/index.ts:17-67` - shapes the expected response.

Pause and predict: if `selectedProjectKey` changes, which effect runs, and what state changes first?

## Trace 2: Issue Status Update

Open these files first:

- `apps/web/src/App.tsx:252-314` - issue panel form controls.
- `apps/web/src/App.tsx:82-99` - client-side optimistic replacement after API response.
- `apps/web/src/lib/api.ts:39-44` - PATCH request.
- `apps/api/src/routes/projects.ts:183-218` - validation, role guard, persistence, audit event.
- `packages/shared/src/index.ts:69-78` - update input contract.

Pause and predict: what happens if story points are `1000`? Existing test: `apps/api/test/projects.test.ts:28-33`.

## Small Safe Change

Ticket idea: add a new API test that rejects a bad status string.

Why it is safe:

- It touches only `apps/api/test/projects.test.ts`.
- It follows the existing validation failure style at `apps/api/test/projects.test.ts:28-33`.
- It exercises the shared update schema at `packages/shared/src/index.ts:69-78`.

Suggested check:

```bash
npm run test -w @buildjira/api
```

## Teach-Back Exercise

In five minutes, explain:

1. Where the board response is validated on the client.
2. Where update input is validated on the server.
3. Where authorization happens.
4. Where the DB write happens.
5. What test proves validation failure today.

Self-grade:

- Basic: can name files.
- Solid: can trace value shapes and status codes.
- Strong: can name the validation boundary, permission boundary, persistence boundary, audit side effect, and a missing test.

## What This Does Not Cover

- Real authentication or sessions; current actor selection is demo-only (`apps/api/src/middleware/requestContext.ts:15-24`).
- CI; no `.github/workflows` files were found.
- Background workers; no queue or worker entry point exists.
- E2E/browser tests; only API tests exist now (`apps/api/test/projects.test.ts:1-34`).
