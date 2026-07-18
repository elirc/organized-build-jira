# 02 Framework Mental Models

## React

Concept: React render is a pure description of UI from state/props. Effects synchronize with external systems. Event handlers mutate state or call services.

Repo anchors:

- State lives at the `App` level (`apps/web/src/App.tsx:21-28`).
- Effects load portfolio and board data (`apps/web/src/App.tsx:30-74`).
- `useMemo` derives filtered issues (`apps/web/src/App.tsx:76-80`).
- Event handlers select projects/issues and save fields (`apps/web/src/App.tsx:131-139`, `apps/web/src/App.tsx:252-314`).

Sharp edges:

- `isMounted` avoids setting state after unmount, but does not cancel network work (`apps/web/src/App.tsx:31-48`, `apps/web/src/App.tsx:52-73`).
- Board grouping refilters for every column (`apps/web/src/App.tsx:170-171`); fine now, measurable later.
- Save errors are swallowed by `finally` resetting `isSaving` (`apps/web/src/App.tsx:252-260`).

Drill: Move from "I clicked status" to "state changed" by tracing `select -> save -> mutateIssue -> setBoard`.

## Express

Concept: Express is a middleware pipeline. Request enters, middleware adds behavior, routes handle matching paths, error middleware translates failures.

Repo anchors:

- Security/logging/body parsing/middleware order: `apps/api/src/app.ts:14-18`.
- Route mounting: `apps/api/src/app.ts:20-21`.
- 404 and error handler: `apps/api/src/app.ts:23-45`.
- Role middleware factory: `apps/api/src/middleware/requestContext.ts:29-43`.

Sharp edges:

- Middleware order matters. `attachActor` must run before protected routes (`apps/api/src/app.ts:18`, `apps/api/src/routes/projects.ts:129-132`).
- The current actor model trusts `x-user-id` (`apps/api/src/middleware/requestContext.ts:15-20`).

Drill: Predict what response a `PATCH /api/issues/bad` request with invalid body gets, and which middleware/route produces it.

## Prisma And SQLite

Concept: Prisma schema describes models and relations; Prisma client performs typed queries. SQLite is a local embedded database, not a distributed service.

Repo anchors:

- Models and relations: `apps/api/prisma/schema.prisma:10-93`.
- Client construction: `apps/api/src/lib/prisma.ts:1-5`.
- Nested includes: `apps/api/src/routes/projects.ts:55-60`, `apps/api/src/routes/projects.ts:79-93`.
- Bootstrap SQL: `apps/api/prisma/bootstrap.ts:5-97`.

Sharp edges:

- `bootstrap.ts` must stay synchronized with `schema.prisma`.
- Raw SQL uses `$executeRawUnsafe` with static strings (`apps/api/prisma/bootstrap.ts:6-96`); do not interpolate user input there.
- Enum-like fields are strings in DB and Zod enum values in app contracts.

## Zod

Concept: Zod validates unknown runtime data and lets TypeScript infer static types from the same source.

Repo anchors:

- Enum schemas: `packages/shared/src/index.ts:3-7`.
- Request schemas: `packages/shared/src/index.ts:69-88`.
- Inferred types: `packages/shared/src/index.ts:90-101`.
- Server parse: `apps/api/src/routes/projects.ts:133`, `apps/api/src/routes/projects.ts:187`.
- Client parse: `apps/web/src/lib/api.ts:28`.

Drill: Add an invalid priority mentally. Where is it rejected for client response and for server request?
