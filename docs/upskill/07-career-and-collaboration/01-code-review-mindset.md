# 01 Code Review Mindset

Review in layers:

1. Does it work?
2. Is it correct?
3. Will it stay correct?
4. Does it fit the codebase?
5. Is it kind to future maintainers?

## Repo-Specific Checklist

- Does a contract change update `packages/shared/src/index.ts:3-101`, API mappers, UI, seed, and tests?
- Does a write route validate input (`apps/api/src/routes/projects.ts:133`, `apps/api/src/routes/projects.ts:187`)?
- Does a write route authorize role and resource (`apps/api/src/middleware/requestContext.ts:29-43`)?
- Does a DB change update both Prisma schema and bootstrap while both exist?
- Does a UI change preserve mobile layout and error states?
- Does the PR include tests comparable to `apps/api/test/projects.test.ts:15-34`?

## Good Review Comments

> I think this needs a resource-level permission check. The role guard proves the actor is an engineer, but the update still uses only issue id at `apps/api/src/routes/projects.ts:190-197`, so a user could target another project.

> This changes the public board payload. Can we update `packages/shared/src/index.ts:53-67` and add an API test so the client/server contract stays explicit?

> The audit insert is useful, but it happens after the issue update. If this becomes compliance-sensitive, we should wrap these writes in a transaction or document the weaker guarantee.

Self-grade:

- Basic: finds obvious errors.
- Solid: checks tests and patterns.
- Strong: names invariants, blast radius, rollback, and a kind path forward.
