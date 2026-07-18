# 03 Type System And Contracts

## Contract Boundary

The shared package is the most important contract boundary. It exports Zod schemas and TypeScript types (`packages/shared/src/index.ts:3-101`). API route code imports schemas to validate request bodies and narrow DB strings (`apps/api/src/routes/projects.ts:1-10`). Web code imports schemas/types to validate responses and type state (`apps/web/src/lib/api.ts:1-9`, `apps/web/src/App.tsx:1-4`).

Why this matters in production:

- A public contract outlives individual implementations.
- Runtime data from HTTP and DB can be wrong even when TypeScript compiles.
- Changing a shared field affects API and UI at once.

## Important Type Patterns

| Pattern | Real example | Why it matters | Failure mode |
| --- | --- | --- | --- |
| Zod enum | `packages/shared/src/index.ts:3-7` | Prevents free-form status/role strings at runtime. | DB can still store bad string if bypassed. |
| Inferred type | `packages/shared/src/index.ts:90-101` | Avoids duplicate TS interfaces. | Overusing inferred types can hide domain aliases. |
| Generic request helper | `apps/web/src/lib/api.ts:13-29` | One fetch path for many response schemas. | Assumes every response body is JSON. |
| Prisma select const | `apps/api/src/routes/projects.ts:16-22` | Avoids returning sensitive/unneeded fields. | Adding password fields later requires careful selects. |
| Module augmentation | `apps/api/src/middleware/requestContext.ts:5-13` | Teaches Express that `req.actor` exists. | Must stay aligned with real auth. |

## Public Contract Change Checklist

Before changing `packages/shared/src/index.ts`:

1. Is the field new, removed, renamed, or type-changed?
2. Which route returns or accepts it? Check `apps/api/src/routes/projects.ts:54-237`.
3. Which UI state/render path consumes it? Check `apps/web/src/App.tsx:21-335`.
4. Does seed data need it? Check `apps/api/prisma/seed.ts:96-180`.
5. Does persistence need it? Check `apps/api/prisma/schema.prisma:10-93`.
6. What tests prove old and new behavior? Current API tests are `apps/api/test/projects.test.ts:15-34`.

## `unknown`, `any`, And Casts

Strong code treats external data as unknown until validated. This repo mostly does that through Zod. Places to inspect:

- `payload` from `response.json()` is unknown-ish at runtime, validated at `apps/web/src/lib/api.ts:22-28`.
- `event.target.value as IssueStatus` is a cast (`apps/web/src/App.tsx:273`); the server validates the final body (`apps/api/src/routes/projects.ts:187`).
- `toIso` casts nested relation objects for `toUser` (`apps/api/src/routes/projects.ts:41-48`); this is a possible refactor candidate.

Drill: Replace one unsafe cast mentally with a parser. What extra error path would the UI need?

Self-grade:

- Basic: can define shared schema and inferred type.
- Solid: can trace one field from DB to UI.
- Strong: can evaluate whether a type assertion is safe or just convenient.
