# 02 Writing Tests Here

Command:

```bash
npm run test -w @buildjira/api
```

Existing style: import `request`, `describe/it/expect`, app factory, and Prisma (`apps/api/test/projects.test.ts:1-6`).

## Recipes

### 1. Happy Path: Health

Add a test that calls `/health` and expects `status: "ok"`. Anchor: `apps/api/src/routes/health.ts:6-13`.

### 2. Happy Path: Issue Update

Use board endpoint to get an issue id (`apps/api/test/projects.test.ts:28-30`), PATCH status to `DONE`, expect 200 and changed status. Anchor: `apps/api/src/routes/projects.ts:183-218`.

### 3. Validation Failure

Existing recipe: story points over 100 returns 400 (`apps/api/test/projects.test.ts:28-33`, `packages/shared/src/index.ts:75`).

### 4. Permission Failure

Find seeded viewer `sam@buildjira.test` (`apps/api/prisma/seed.ts:46-53`), send `x-user-id`, PATCH issue, expect 403 from `requireRole` (`apps/api/src/middleware/requestContext.ts:36-38`).

### 5. Resource Missing

PATCH a fake issue id and expect 404 (`apps/api/src/routes/projects.ts:190-193`).

### 6. Audit Side Effect

After successful issue update, query `prisma.auditEvent.findMany` for `issue.updated`. Anchor: `apps/api/src/routes/projects.ts:208-216`.

### 7. Schema Behavior

After `npm run db:migrate`, assert table exists by calling health or querying user count. Anchor: `apps/api/prisma/bootstrap.ts:5-97`.

### 8. UI State Future Test

When UI test tooling is added, render `App`, mock `getBoard`, change status, and assert card moves. Anchor: `apps/web/src/App.tsx:82-99`, `apps/web/src/App.tsx:170-184`.

## Review Checklist For Tests

- Does the test fail for the right reason before the fix?
- Does it assert behavior, not implementation noise?
- Is the fixture explicit?
- Does it cover failure paths, not only happy path?
