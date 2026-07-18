# 03 Validation, Auth, And Permissions

## Validation Layers

| Layer | Anchor | What it validates |
| --- | --- | --- |
| Env | `apps/api/src/config/env.ts:4-13` | Server env shape and defaults. |
| Client response | `apps/web/src/lib/api.ts:13-29` | API JSON matches shared schema. |
| Server request | `apps/api/src/routes/projects.ts:133`, `apps/api/src/routes/projects.ts:187` | Create/update request bodies. |
| Role narrowing | `apps/api/src/middleware/requestContext.ts:22-24` | DB role string is known role. |
| Error translation | `apps/api/src/app.ts:30-39` | Zod errors become 400 JSON. |

## Authentication

Confirmed current behavior: no real authentication provider exists. `attachActor` reads `x-user-id`; if absent, it loads the first user (`apps/api/src/middleware/requestContext.ts:15-20`). This is a demo identity mechanism, not production auth.

## Authorization

Role guards protect create/update/audit routes:

- Create issue: `apps/api/src/routes/projects.ts:129-132`.
- Update issue: `apps/api/src/routes/projects.ts:183-185`.
- Audit list: `apps/api/src/routes/projects.ts:222-237`.
- Guard implementation: `apps/api/src/middleware/requestContext.ts:29-43`.

No resource-level authorization exists. A user with allowed role can update any issue id if they know it (`apps/api/src/routes/projects.ts:190-197`). Label this as an IDOR risk for future multi-user production.

## What A Junior Might Miss

- Validation is not authorization.
- `x-user-id` is not secure identity.
- Shared schemas protect API shapes but not DB constraints.

## What A Senior Checks

- Can a user access another project?
- Does every write check membership, role, and resource ownership?
- Are authorization failures tested?
- Are audit events trustworthy?
- Is CORS configured for expected origins only (`apps/api/src/app.ts:15`)?

## Drill

Write permission tests for viewer PATCH and fake user id. Strong answer includes expected status code and why the current default actor behavior complicates no-auth testing.
