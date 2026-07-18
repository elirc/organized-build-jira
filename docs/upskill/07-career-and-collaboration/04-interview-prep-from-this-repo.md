# 04 Interview Prep From This Repo

This file turns BuildJira into interview preparation for mid-level software engineering roles. The repo is TypeScript/JavaScript, but the concepts transfer to Python backend interviews too: validation, async, API boundaries, testing, persistence, auth, and system design.

## JavaScript / TypeScript Runtime Questions

### Q: Explain `async/await` in this codebase.

Repo anchors: React effects `apps/web/src/App.tsx:30-74`, API route awaits `apps/api/src/routes/projects.ts:54-61`, seed parallelism `apps/api/prisma/seed.ts:21-84`.

- Junior answer: "The code waits for API or DB calls before continuing."
- Mid-level answer: "Effects and route handlers return promises; `await` yields. Independent seed writes use `Promise.all`, while route writes are serial."
- Senior answer: "The serial issue update then audit write creates consistency risk; board loads can race without cancellation; concurrent issue creates can choose the same key."

### Q: Why use TypeScript if runtime data can still be wrong?

Anchors: shared schemas `packages/shared/src/index.ts:3-101`, client parse `apps/web/src/lib/api.ts:28`, server parse `apps/api/src/routes/projects.ts:187`.

- Junior: "Types catch mistakes while coding."
- Mid-level: "External data is unknown; Zod validates runtime payloads and infers TypeScript types."
- Senior: "Contracts define compatibility boundaries. DB string enums and unsafe casts need runtime checks and migration discipline."

### Q: What is a closure bug you would watch for?

Anchor: functional state update in `apps/web/src/App.tsx:84-97`.

- Junior: "State can be old."
- Mid-level: "Using `setBoard(current => ...)` avoids closing over stale `board`."
- Senior: "This protects local mutation reconciliation, but network request races still need cancellation or query keys."

## React Questions

### Q: Where should state live?

Anchor: top-level state `apps/web/src/App.tsx:21-28`, selected issue panel `apps/web/src/App.tsx:228-317`.

- Junior: "In the component using it."
- Mid-level: "Shared board/project state lives in `App` because sidebar, board, and panel all need it."
- Senior: "As screens grow, server state should move to a cache layer while transient form state remains local."

### Q: What is derived state?

Anchor: filtered issues `apps/web/src/App.tsx:76-80`, done count recompute `apps/web/src/App.tsx:91-95`.

- Junior: "A value calculated from state."
- Mid-level: "Do not store filtered issues separately when they can be derived."
- Senior: "Derived work must be cheap or memoized; large boards may need grouping/indexing."

## Node / Express Questions

### Q: Explain middleware order.

Anchor: `apps/api/src/app.ts:14-21`.

- Junior: "Middleware runs before routes."
- Mid-level: "Security headers, CORS, body parsing, logging, actor context, then routes."
- Senior: "Auth context must precede protected routes; error middleware must be after routes; request ids should be early for observability."

### Q: What is the difference between authentication and authorization?

Anchors: actor attachment `apps/api/src/middleware/requestContext.ts:15-24`, role guard `apps/api/src/middleware/requestContext.ts:29-43`.

- Junior: "Authentication is who you are; authorization is what you can do."
- Mid-level: "This repo only has demo identity plus role authorization."
- Senior: "Header identity is spoofable, and role-only authorization misses resource isolation/IDOR."

## Python Transfer Questions

Even though this repo is JS/TS, interviewers may ask how you would express the same ideas in Python.

### Q: What is the Python equivalent of Zod validation?

Repo concept: schemas at `packages/shared/src/index.ts:69-88`.

- Junior: "Use a validation library."
- Mid-level: "In Python I would use Pydantic models or FastAPI request models to validate body shape at runtime."
- Senior: "I would treat models as boundary contracts, separate DB ORM models from API DTOs, version breaking changes, and add tests for invalid payloads."

### Q: Compare async in Node and Python.

Repo concept: `await prisma...` in `apps/api/src/routes/projects.ts:54-61`, `Promise.all` in `apps/api/prisma/seed.ts:21-84`.

- Junior: "Both can await IO."
- Mid-level: "Node promises and Python `asyncio` both need careful concurrency; `Promise.all` maps roughly to `asyncio.gather`."
- Senior: "Both need cancellation, timeout, transaction boundaries, and backpressure. I would avoid concurrent writes that compute unique keys without locking."

### Q: How would you test this API in Python?

Repo concept: Supertest API tests `apps/api/test/projects.test.ts:15-34`.

- Junior: "Use pytest."
- Mid-level: "Use FastAPI TestClient or httpx, seed fixtures, assert status and JSON."
- Senior: "Use fixture-scoped DB isolation, builders, transaction rollbacks, and explicit auth identities for permission tests."

## Debugging Interview Questions

| Question | Repo anchor | Strong answer includes |
| --- | --- | --- |
| PATCH returns 400. What do you do? | `packages/shared/src/index.ts:69-78`, `apps/api/src/app.ts:30-39` | Reproduce, inspect request body, validate schema, add regression test. |
| Board is slow. What do you inspect? | `apps/api/src/routes/projects.ts:79-93`, `apps/web/src/App.tsx:170-184` | Measure network/server/render separately. |
| Viewer can update issue. What failed? | `apps/api/src/middleware/requestContext.ts:29-43`, `apps/api/src/routes/projects.ts:190-197` | Role vs resource auth, test identity, IDOR. |
| Audit missing after update. What happened? | `apps/api/src/routes/projects.ts:196-216` | Multi-write consistency, transaction/outbox. |

## System Design Prompts

1. Design project membership isolation for BuildJira.
2. Add issue comments and activity stream.
3. Replace demo auth with OIDC.
4. Scale board load to 100k issues.
5. Add reliable audit/outbox.

Strong senior answer includes boundaries, data model, API contract, migration, tests, security, performance, rollout, and rollback.

## Code Review Prompts

- Review a PR that removes `schema.parse(payload)` from `apps/web/src/lib/api.ts:28`.
- Review a PR that changes issue status only in UI at `apps/web/src/App.tsx:273-279`.
- Review a PR that updates issue without audit at `apps/api/src/routes/projects.ts:196-216`.

## Behavioral Prompts

Use contributions from this repo:

- "Tell me about a time you improved reliability." Use transactional audit proposal.
- "Tell me about a time you found a security issue." Use demo auth/IDOR analysis.
- "Tell me about a time you improved tests." Use permission/validation test tickets.
- "Tell me about a time you made a tradeoff." Use bootstrap SQL fallback vs real migrations.

Rubric:

- Junior story: describes task and outcome.
- Mid-level story: includes constraints, tests, and collaboration.
- Senior story: includes tradeoffs, risk reduction, migration, rollback, and how others learned from it.
