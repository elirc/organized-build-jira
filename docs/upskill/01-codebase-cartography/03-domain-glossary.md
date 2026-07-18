# 03 Domain Glossary

| Term | Meaning | Code anchors | Confusions to avoid |
| --- | --- | --- | --- |
| Project | Delivery container with key, health, lead, issues, columns, and sprints. | `apps/api/prisma/schema.prisma:23-36`, `packages/shared/src/index.ts:17-27` | Project key is not DB id. |
| Issue | Work item on a project board. | `apps/api/prisma/schema.prisma:61-82`, `packages/shared/src/index.ts:37-51` | Issue `key` is human-readable; `id` is internal. |
| BoardColumn | Workflow column tied to a project and status. | `apps/api/prisma/schema.prisma:38-48`, `apps/api/prisma/seed.ts:5-11` | Column name and status are related but not identical. |
| Sprint | Timeboxed planning unit with goal and dates. | `apps/api/prisma/schema.prisma:50-59`, `apps/api/prisma/seed.ts:86-94` | Only latest sprint is returned now (`apps/api/src/routes/projects.ts:91`, `apps/api/src/routes/projects.ts:117-125`). |
| User | Actor, assignee, reporter, or project lead. | `apps/api/prisma/schema.prisma:10-21`, `packages/shared/src/index.ts:9-15` | Actor is demo-derived, not authenticated. |
| Role | Permission label. | `packages/shared/src/index.ts:6`, `apps/api/src/middleware/requestContext.ts:29-43` | Role check is not identity proof. |
| AuditEvent | Record for issue/project events. | `apps/api/prisma/schema.prisma:84-93`, `apps/api/src/routes/projects.ts:169-177`, `apps/api/src/routes/projects.ts:208-216` | Metadata is JSON string, not typed JSON. |
| Health | Project delivery state. | `packages/shared/src/index.ts:7`, `apps/api/prisma/seed.ts:56-74` | Health is manually stored; no calculator exists. |
| WIP limit | Column limit for work in progress. | `apps/api/prisma/schema.prisma:43`, `apps/web/src/App.tsx:174-180` | UI displays overload; server does not enforce it. |
| Rank | Integer order value for issues. | `apps/api/prisma/schema.prisma:70`, `apps/api/src/routes/projects.ts:161` | Simple spacing, not robust ordering. |

## Near-Synonyms

- `status` vs `column`: status is domain state; column is board presentation.
- `lead` vs `assignee`: lead owns a project; assignee owns an issue.
- `reporter` vs `actor`: reporter created/reported an issue; actor is current request user.

## Drill

For every noun above, find one UI occurrence and one API/data occurrence. If a noun has no UI occurrence yet, mark it backend-only and explain why that matters.
