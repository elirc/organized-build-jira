# 05 Security Checklist

## Repo-Specific Risks

| Risk | Current evidence | Status |
| --- | --- | --- |
| Authentication | Demo `x-user-id` actor (`apps/api/src/middleware/requestContext.ts:15-24`) | Not production-ready. |
| Authorization | Role guard only (`apps/api/src/middleware/requestContext.ts:29-43`) | Needs resource checks. |
| IDOR | Update by issue id without project membership (`apps/api/src/routes/projects.ts:190-197`) | Confirmed future risk. |
| Input validation | Zod request schemas (`packages/shared/src/index.ts:69-88`) | Good baseline. |
| XSS | React escapes text by default; issue title rendered normally (`apps/web/src/App.tsx:218`) | Avoid `dangerouslySetInnerHTML`. |
| CSRF | No cookie session yet; CORS configured (`apps/api/src/app.ts:15`) | Revisit with auth cookies. |
| SQL injection | Prisma calls; static bootstrap SQL (`apps/api/prisma/bootstrap.ts:6-96`) | Do not interpolate raw SQL. |
| Secrets | No secrets required; env example has local values (`.env.example:1-4`) | Keep future secrets out of repo. |
| Rate limiting | Not present | Add before public deployment. |
| Dependency risk | npm packages in manifests | Run audit in maintained environments. |
| File uploads/webhooks | Not present | Add separate threat model if introduced. |

## Pre-Merge Security Checklist

- Does every write have authentication and authorization?
- Does authorization check the resource, not just role?
- Are request bodies validated with shared schemas?
- Are IDs scoped to project/tenant?
- Are errors stable and not leaking stack traces?
- Are secrets absent from source and client env?
- Is any raw SQL parameterized or static?
- Are CORS and future CSRF settings appropriate for auth mode?

## Drill

Write an attack story for "viewer updates ATLAS-103." Then write the test that should fail today or after hardening.
