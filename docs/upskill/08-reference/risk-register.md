# Risk Register

| Risk | Evidence | File anchors | Impact | Likelihood | Suggested test | Suggested fix | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Spoofable demo actor | `x-user-id` trusted or first user fallback | `apps/api/src/middleware/requestContext.ts:15-24` | Unauthorized access in production | High if deployed | invalid/fake header tests | Real auth middleware | High |
| Role-only authorization | Update by issue id after role guard | `apps/api/src/routes/projects.ts:183-197` | IDOR/cross-project writes | High as users grow | viewer/cross-project tests | Membership/resource filter | High |
| Audit not transactional | Issue write then audit write | `apps/api/src/routes/projects.ts:196-216` | Missing audit rows | Medium | forced audit failure test | Prisma transaction/outbox | High |
| Bootstrap/schema drift | Duplicated model definitions | `apps/api/prisma/schema.prisma:10-93`, `apps/api/prisma/bootstrap.ts:5-97` | Local/prod mismatch | Medium | schema drift check | Real migrations | High |
| Thin API test coverage | Only 3 tests | `apps/api/test/projects.test.ts:15-34` | Regressions missed | High | add route tests | Broaden API tests | High |
| Client save errors hidden | Save resets spinner only | `apps/web/src/App.tsx:252-260` | User thinks save worked | Medium | mocked failed save UI test | Render save error | High |
| Non-JSON response handling | `response.json()` before `ok` check | `apps/web/src/lib/api.ts:22-25` | Bad error UX | Medium | mock non-JSON response | safe parse fallback | High |
| Board overfetch | Full graph loaded | `apps/api/src/routes/projects.ts:79-126` | Slow large boards | Medium later | large seed/load test | pagination/indexes | Medium |
| Portfolio count scaling | Loads statuses for counts | `apps/api/src/routes/projects.ts:55-60`, `apps/api/src/routes/projects.ts:71-72` | Slow portfolios | Medium later | many issue benchmark | aggregate query | Medium |
| Missing rate limiting | No limiter middleware | `apps/api/src/app.ts:14-21` | Abuse risk | Medium if public | load/abuse test | rate limiter | High |
| No CI | No workflow found in file inventory | repository inventory | Manual regressions | High for collaboration | add CI | GitHub Actions | High |
| Raw SQL unsafe if copied | `$executeRawUnsafe` exists | `apps/api/prisma/bootstrap.ts:6-96` | SQL injection if used with input | Low now | code review check | parameterized queries | High |
| Vite env secret risk | Client env exposed | `apps/web/src/lib/api.ts:11`, `.env.example:4` | Secret leak if misused | Medium | review env names | never use secrets in `VITE_*` | High |
