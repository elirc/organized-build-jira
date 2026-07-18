# 01 Testing Strategy

## Current Tests

The repo currently has API/router tests using Vitest and Supertest (`apps/api/test/projects.test.ts:1-34`). They create an Express app without opening a port (`apps/api/test/projects.test.ts:3-6`) and assert portfolio read, board read, and validation failure (`apps/api/test/projects.test.ts:15-34`).

## Test Layers To Add

| Layer | What belongs here | Repo example or target |
| --- | --- | --- |
| Unit | Pure helpers and mappers | Future tests for `toUser`/`toIso` from `apps/api/src/routes/projects.ts:24-52` if extracted. |
| API/router | HTTP status, validation, permissions, response shape | Current `apps/api/test/projects.test.ts:15-34`. |
| Contract/type | Shared schemas parse expected payloads | `packages/shared/src/index.ts:3-101`. |
| Persistence | Schema/bootstrap behavior, relations | `apps/api/prisma/bootstrap.ts:5-97`. |
| UI component | Rendering and state transitions | Future tests for `apps/web/src/App.tsx:159-317`. |
| E2E | Browser workflows across API/UI | Not present. Would cover board load and issue update. |

## What Not To Test

- Do not test React itself.
- Do not snapshot huge DOM trees.
- Do not assert implementation details like exact Prisma include object unless it protects behavior.
- Do not depend on global seed data forever; introduce builders as test count grows.

## Fixtures And Isolation

Current tests require seeded DB (`apps/api/test/projects.test.ts:8-12`). That is acceptable for early practice but weak for CI. Better long-term:

- Create per-test database or transaction rollback.
- Use fixture builders for users/projects/issues.
- Avoid test order dependence.
- Control time for sprint/date logic.

## Flake Prevention

- Keep tests deterministic; seed data resets rows (`apps/api/prisma/seed.ts:14-19`).
- Avoid tests that depend on current date except where explicitly controlled.
- Prefer API tests over E2E for validation/permission logic.
