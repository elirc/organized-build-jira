# 03 Architecture And Patterns

This module teaches engineering taste: boundaries, contracts, persistence, validation, permissions, side effects, pattern recognition, and critique.

Use this module after you can trace the portfolio and issue update flows in [key flows](../01-codebase-cartography/05-key-flows.md).

Core anchors:

- UI state and rendering: `apps/web/src/App.tsx:21-335`
- Client API boundary: `apps/web/src/lib/api.ts:13-44`
- Server composition: `apps/api/src/app.ts:11-47`
- Routes and application logic: `apps/api/src/routes/projects.ts:24-237`
- Data model: `apps/api/prisma/schema.prisma:10-93`
- Validation/contracts: `packages/shared/src/index.ts:3-101`
