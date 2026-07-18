# 02 Writing PRs And RFCs

## PR Template

```md
## What changed
- ...

## Why
- ...

## How tested
- [ ] npm run build
- [ ] npm run lint
- [ ] npm run test -w @buildjira/api

## Screenshots/logs
- ...

## Risks
- ...

## Follow-ups
- ...
```

## Commit Messages

Use concise imperative messages:

- `test(api): cover invalid issue status`
- `docs(upskill): add key flow trace tables`
- `fix(web): show issue save errors`

## When To Write An RFC

Write an RFC when a change affects contracts, schema, auth, migration strategy, or multiple contributors. Examples:

- Replacing demo actor (`apps/api/src/middleware/requestContext.ts:15-24`).
- Adding tenant membership to update routes (`apps/api/src/routes/projects.ts:190-197`).
- Replacing bootstrap SQL with migrations (`apps/api/prisma/bootstrap.ts:5-97`).

## RFC Template

```md
# RFC: Title

## Problem
## Goals
## Non-goals
## Current behavior with anchors
## Proposed design
## Data model / contract changes
## Migration plan
## Test plan
## Security considerations
## Performance considerations
## Rollout and rollback
## Open questions
```

Drill: Write an RFC for typed API errors using `apps/api/src/app.ts:30-42` and `apps/web/src/lib/api.ts:22-28`.
