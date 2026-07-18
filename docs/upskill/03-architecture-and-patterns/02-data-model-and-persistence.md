# 02 Data Model And Persistence

## Schema Map

| Entity | Anchor | Relationships |
| --- | --- | --- |
| User | `apps/api/prisma/schema.prisma:10-21` | Leads projects, assigned issues, reported issues, audit events. |
| Project | `apps/api/prisma/schema.prisma:23-36` | Has lead, issues, columns, sprints. |
| BoardColumn | `apps/api/prisma/schema.prisma:38-48` | Belongs to project; unique `(projectId, status)`. |
| Sprint | `apps/api/prisma/schema.prisma:50-59` | Belongs to project; has issues. |
| Issue | `apps/api/prisma/schema.prisma:61-82` | Belongs to project, optional sprint/assignee, required reporter. |
| AuditEvent | `apps/api/prisma/schema.prisma:84-93` | Optional actor, entity/action metadata. |

## Indexes And Constraints

- Unique email: `apps/api/prisma/schema.prisma:13`.
- Unique project key: `apps/api/prisma/schema.prisma:25`.
- Unique board column status per project: `apps/api/prisma/schema.prisma:47`.
- Unique issue key: `apps/api/prisma/schema.prisma:63`.

Missing or future constraints:

- No index on `Issue.projectId/status/rank`; board query may need it later (`apps/api/src/routes/projects.ts:84-85`).
- Enum-like strings are not DB-constrained (`apps/api/prisma/schema.prisma:15`, `apps/api/prisma/schema.prisma:28`, `apps/api/prisma/schema.prisma:66-68`).
- No tenant/workspace model.

## Transaction Boundaries

Current write routes perform multiple writes without an explicit transaction:

- Issue create then audit insert (`apps/api/src/routes/projects.ts:150-177`).
- Issue update then audit insert (`apps/api/src/routes/projects.ts:196-216`).

Consistency expectation today: audit is useful but not guaranteed if second write fails. If audit becomes compliance-critical, wrap mutation + audit in a transaction.

## How To Safely Change Schema

1. Update `apps/api/prisma/schema.prisma`.
2. Update `apps/api/prisma/bootstrap.ts` while bootstrap remains in use.
3. Update seed data in `apps/api/prisma/seed.ts`.
4. Update shared schemas if the field crosses API boundary.
5. Update route mappers and UI.
6. Add tests for old and new behavior.
7. Add a rollback note.

Drill: Add a hypothetical `Issue.severity`. List every file touched and whether it is data-only, API contract, or UI.
