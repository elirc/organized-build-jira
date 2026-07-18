# 01 Language Runtime Model

## JavaScript Async: Event Loop And Promises

Concept: JavaScript runs one call stack per thread. `async` functions return promises; `await` yields until the promise settles. Production code must avoid accidental serial work, unhandled rejections, and stale UI updates.

Repo examples:

- React effects call async loaders and guard state with `isMounted` (`apps/web/src/App.tsx:30-49`, `apps/web/src/App.tsx:51-74`).
- API routes are async and await Prisma (`apps/api/src/routes/projects.ts:54-61`, `apps/api/src/routes/projects.ts:196-206`).
- Seed uses `Promise.all` for independent user creation (`apps/api/prisma/seed.ts:21-54`) and for creating columns (`apps/api/prisma/seed.ts:76-84`).

Failure modes:

- Race: board request A can finish after board request B because `apps/web/src/App.tsx:51-74` does not cancel fetches.
- Partial side effect: issue update can succeed and audit insert can fail because they are separate awaits (`apps/api/src/routes/projects.ts:196-216`).
- Parallelism hazard: concurrent issue creates can compute the same key (`apps/api/src/routes/projects.ts:144-152`).

Drill: Rewrite the issue update flow as a trace of awaited operations. Mark which awaits can fail and what state is already changed.

Self-grade:

- Basic: can point to `await`.
- Solid: names serial vs parallel work.
- Strong: identifies race/transaction risk and proposes cancellation or transaction.

## TypeScript Runtime Reality

Concept: TypeScript types disappear at runtime. Runtime validation must be explicit.

Repo examples:

- Shared schemas are runtime validators and type sources (`packages/shared/src/index.ts:3-101`).
- Server validates request bodies with `updateIssueSchema.parse` and `createIssueSchema.parse` (`apps/api/src/routes/projects.ts:133`, `apps/api/src/routes/projects.ts:187`).
- Client validates response JSON with `schema.parse(payload)` (`apps/web/src/lib/api.ts:28`).

Failure modes:

- Unsafe casts can hide mismatches, such as form values cast to `IssueStatus` (`apps/web/src/App.tsx:273`) or `IssuePriority` (`apps/web/src/App.tsx:296`).
- DB stores enum-like values as strings (`apps/api/prisma/schema.prisma:15`, `apps/api/prisma/schema.prisma:28`, `apps/api/prisma/schema.prisma:66-68`), so narrowing helpers matter (`apps/api/src/routes/projects.ts:24-39`).

Drill: Find every `as` cast in `apps/web/src/App.tsx` and decide whether runtime validation exists later.

## Node Runtime

Concept: Node owns server-side IO: HTTP, database calls, environment parsing, logs, process exit. It does not have browser DOM APIs.

Repo examples:

- Server starts listening in `apps/api/src/server.ts:4-7`.
- Environment is loaded and validated in `apps/api/src/config/env.ts:1-13`.
- Prisma client is a singleton module export (`apps/api/src/lib/prisma.ts:1-5`).

Pitfall checklist:

- Do not import browser-only code into API files.
- Do not trust `process.env`; parse it (`apps/api/src/config/env.ts:4-11`).
- Do not let unhandled route errors leak internals; centralize error responses (`apps/api/src/app.ts:27-45`).

## Browser Runtime

Concept: Browser code is event-driven and hostile to secrets. Anything in `VITE_*` is visible to users.

Repo examples:

- Vite exposes `VITE_API_URL` to browser code (`apps/web/src/lib/api.ts:11`, `.env.example:4`).
- React bootstraps into `#root` (`apps/web/src/main.tsx:6-16`).

Drill: Explain why an auth client secret must never become `VITE_AUTH_SECRET`.
