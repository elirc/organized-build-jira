# 01 Annotation Drills

For each excerpt, annotate inputs, outputs, dependencies, invariants, side effects, and failure modes. Use this rubric:

- Basic: marks inputs/outputs.
- Solid: marks dependency and one invariant.
- Strong: marks failure mode, missing test, and blast radius.

## Drill 1: Shared Status Enum

Excerpt: `packages/shared/src/index.ts:3-7`

Prompt: What runtime values are legal? What DB fields depend on these strings?

## Drill 2: Project Summary Schema

Excerpt: `packages/shared/src/index.ts:17-27`

Prompt: Which fields are computed vs persisted? Hint: compare `apps/api/src/routes/projects.ts:63-75`.

## Drill 3: Fetch Wrapper

Excerpt: `apps/web/src/lib/api.ts:13-29`

Prompt: What happens on non-JSON error, invalid success JSON, and network failure?

## Drill 4: Portfolio Effect

Excerpt: `apps/web/src/App.tsx:30-49`

Prompt: What state can change? What does `isMounted` protect? What does it not protect?

## Drill 5: Board Render

Excerpt: `apps/web/src/App.tsx:168-193`

Prompt: How does one issue decide which column it appears in?

## Drill 6: Issue Save

Excerpt: `apps/web/src/App.tsx:252-260`

Prompt: Where does the error go if `onChange` rejects? What user feedback is missing?

## Drill 7: Actor Attachment

Excerpt: `apps/api/src/middleware/requestContext.ts:15-27`

Prompt: Is this authentication, authorization, or context attachment? What is spoofable?

## Drill 8: Role Guard

Excerpt: `apps/api/src/middleware/requestContext.ts:29-43`

Prompt: What is protected? What is not resource-checked?

## Drill 9: Board Query

Excerpt: `apps/api/src/routes/projects.ts:79-93`

Prompt: Which relations are loaded? Which could become expensive?

## Drill 10: Issue Update

Excerpt: `apps/api/src/routes/projects.ts:183-218`

Prompt: Mark validation, authorization, lookup, mutation, audit, and response.

## Drill 11: Bootstrap SQL

Excerpt: `apps/api/prisma/bootstrap.ts:60-83`

Prompt: Compare to `apps/api/prisma/schema.prisma:61-82`. What can drift?

## Drill 12: API Tests

Excerpt: `apps/api/test/projects.test.ts:15-34`

Prompt: What behavior is covered? What important behavior is not covered?
