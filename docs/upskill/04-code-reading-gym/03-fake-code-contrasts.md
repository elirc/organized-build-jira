# 03 Fake Code Contrasts

## Contrast 1: Coupling UI To DB Shape

```ts
// Illustrative fake code: not from this repo.
setBoard(await fetch("/api/raw-prisma-project").then((r) => r.json()));
```

Better: parse public contract as in `apps/web/src/lib/api.ts:28` and `packages/shared/src/index.ts:53-67`.

## Contrast 2: Missing Permission Guard

```ts
// Illustrative fake code: not from this repo.
router.patch("/issues/:id", async (req, res) => res.json(await prisma.issue.update(...)));
```

Better: use `requireRole` as in `apps/api/src/routes/projects.ts:183-185`, then add resource checks.

## Contrast 3: N+1 Query

```ts
// Illustrative fake code: not from this repo.
const issues = await prisma.issue.findMany();
for (const issue of issues) issue.assignee = await prisma.user.findUnique(...);
```

Better: include related users in one query like `apps/api/src/routes/projects.ts:84-89`.

## Contrast 4: Stale State

```ts
// Illustrative fake code: not from this repo.
setBoard({ ...board, issues: board.issues.map(...) });
```

Better: functional update avoids stale closure (`apps/web/src/App.tsx:84-97`).

## Contrast 5: Side Effect In Unreliable Place

```ts
// Illustrative fake code: not from this repo.
await prisma.issue.update(...);
sendEmail(); // if this fails, what happened?
```

Better: model reliability. Current audit write at `apps/api/src/routes/projects.ts:208-216` is a learning target for transactions/outbox.

## Contrast 6: Swallowing Errors

```ts
// Illustrative fake code: not from this repo.
try { await save(); } catch {}
```

Better: surface actionable error. Current `IssuePanel` resets saving but does not render save errors (`apps/web/src/App.tsx:252-260`).

## Contrast 7: Overusing `any`

```ts
// Illustrative fake code: not from this repo.
function request(path: string): Promise<any> { ... }
```

Better: generic schema parser (`apps/web/src/lib/api.ts:13-29`).

## Contrast 8: Changing Public Contracts Casually

```ts
// Illustrative fake code: not from this repo.
// Rename issue.storyPoints to issue.points in API only.
```

Better: update shared schema (`packages/shared/src/index.ts:37-51`), API mapper, UI, seed, and tests together.

## Contrast 9: Trusting Header Auth

```ts
// Illustrative fake code: not from this repo.
const userId = req.header("x-user-id"); // production identity
```

Better: current code is explicitly demo context (`apps/api/src/middleware/requestContext.ts:15-24`); production needs verified sessions/tokens.

## Contrast 10: Unbounded Reads

```ts
// Illustrative fake code: not from this repo.
return prisma.auditEvent.findMany();
```

Better: cap results as in audit route `take: 50` (`apps/api/src/routes/projects.ts:223-226`).

## Contrast 11: Unsafe SQL With User Input

```ts
// Illustrative fake code: not from this repo.
await prisma.$executeRawUnsafe(`DELETE FROM Issue WHERE id = '${req.params.id}'`);
```

Better: static bootstrap SQL is acceptable only because no user input is interpolated (`apps/api/prisma/bootstrap.ts:6-96`).

## Contrast 12: Testing Only Happy Path

```ts
// Illustrative fake code: not from this repo.
it("updates issue", async () => expect(200));
```

Better: include validation and permission failures. Existing validation test: `apps/api/test/projects.test.ts:28-33`.
