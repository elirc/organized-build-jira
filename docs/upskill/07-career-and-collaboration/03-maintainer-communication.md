# 03 Maintainer Communication

## Ask For Help Without Outsourcing Thinking

Bad: "It does not work. What do I do?"

Better:

> I am tracing issue update from `apps/web/src/App.tsx:252-314` to `apps/api/src/routes/projects.ts:183-218`. The request reaches the server but returns 400. I checked `updateIssueSchema` at `packages/shared/src/index.ts:69-78` and suspect the field value is not valid. Does this repo prefer fixing the UI select or adding a server-side clearer error?

## Bug Report Template

```md
## Symptom
## Steps to reproduce
## Expected
## Actual
## Environment
## Logs/screenshots
## Files inspected
## Suspected layer
```

## Feature Proposal Template

```md
## User value
## Current behavior with anchors
## Proposed behavior
## Smallest useful version
## Tests
## Risks / non-goals
```

## Responding To Requested Changes

Use:

> Good catch. I added a permission test for viewer PATCH and updated the route to keep the existing `requireRole` pattern. The test now covers the behavior you flagged.

Avoid:

> Fixed.

## Respectful Disagreement

Use evidence:

> I agree the route file is growing. I suggest delaying extraction until after one more write route because right now `apps/api/src/routes/projects.ts:24-237` is still small enough, and extracting too early may create extra indirection. I can add a follow-up note.
