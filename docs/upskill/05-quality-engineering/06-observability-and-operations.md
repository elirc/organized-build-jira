# 06 Observability And Operations

## Current Observability

| Signal | Anchor | What it tells you | Gap |
| --- | --- | --- | --- |
| HTTP logs | `apps/api/src/app.ts:17` | Requests and status codes. | Not structured; no request id. |
| Error logs | `apps/api/src/app.ts:41` | Unknown server errors. | No context, metrics, or tracing. |
| Health | `apps/api/src/routes/health.ts:6-13` | API can query DB. | No separate liveness/readiness. |
| Audit events | `apps/api/src/routes/projects.ts:169-177`, `apps/api/src/routes/projects.ts:208-216` | Issue/project mutations. | Not transactional; no UI view except `/audit`. |

## How Would I Know This Broke?

| Flow | Symptom | Probe |
| --- | --- | --- |
| Portfolio load | UI error row or empty project list | `GET /api/projects`, Morgan logs. |
| Board load | Loading or error row | `GET /api/projects/ATLAS/board`. |
| Issue update | Field snaps back or no change | PATCH endpoint, DB row, audit row. |
| Auth guard | Viewer can write or engineer blocked | Permission tests. |
| DB startup | Health fails | `/health`, Prisma logs. |

## Production Additions

- Structured logger with request id.
- Metrics: request count/latency/status, DB latency, mutation count.
- Tracing around route -> Prisma -> response.
- Error reporting with environment and release.
- Readiness/liveness split.
- Deployment rollback plan for schema changes.

## Drill

Design a log line for issue update that includes actor id, issue id, project id, status change, request id, and result without leaking full metadata.
