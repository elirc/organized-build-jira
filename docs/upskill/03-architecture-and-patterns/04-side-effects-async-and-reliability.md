# 04 Side Effects, Async, And Reliability

## Current Side Effects

| Side effect | Anchor | Reliability note |
| --- | --- | --- |
| Database reads/writes | `apps/api/src/routes/projects.ts:54-237` | Direct Prisma calls inside routes. |
| Audit event writes | `apps/api/src/routes/projects.ts:169-177`, `apps/api/src/routes/projects.ts:208-216` | Separate write after issue mutation. |
| Seed data reset | `apps/api/prisma/seed.ts:14-19` | Destructive local operation. |
| Health DB probe | `apps/api/src/routes/health.ts:6-13` | Readiness-ish check. |
| Browser fetch | `apps/web/src/lib/api.ts:13-29` | No retry/cancellation. |

No queues, cron jobs, webhooks, emails, file uploads, or background workers were found.

## Concepts

- **Idempotency:** repeated operation has same effect. Seed is intentionally idempotent-ish because it deletes and recreates data (`apps/api/prisma/seed.ts:14-191`), but issue create is not idempotent (`apps/api/src/routes/projects.ts:144-152`).
- **Retries:** retrying issue create can create duplicate work. A production API would need client-generated idempotency keys.
- **Outbox pattern:** write domain change and side-effect event in one transaction, then process later. Audit writes are a candidate if audit becomes critical.
- **Backpressure:** no queue exists, but board reads could become heavy if projects have many issues (`apps/api/src/routes/projects.ts:79-93`).
- **Timeouts:** fetch and Prisma calls do not set explicit timeouts.

## Risky Places

- Audit after mutation without transaction (`apps/api/src/routes/projects.ts:196-216`).
- UI save errors not surfaced (`apps/web/src/App.tsx:252-260`).
- Board effect can race without cancellation (`apps/web/src/App.tsx:51-74`).

## Drill

Design an outbox-style audit path for issue update. Self-grade by whether your design preserves the issue update, audit intent, retry, and failure visibility.
