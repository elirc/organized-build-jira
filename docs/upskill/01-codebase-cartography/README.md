# 01 Codebase Cartography

This module teaches you to move through the repo deliberately. Do not start by editing. First learn the shape, contracts, flows, and names.

Learning goals:

- Identify the monorepo packages and runtime surfaces.
- Trace UI -> API -> validation -> persistence -> response.
- Recognize product nouns: Project, Issue, Sprint, BoardColumn, User, AuditEvent.
- Separate public contracts from private implementation details.

Core files:

- `package.json:7-19` - workspace and scripts.
- `packages/shared/src/index.ts:3-101` - public contracts.
- `apps/api/src/app.ts:11-47` - server composition.
- `apps/web/src/App.tsx:21-335` - main UI.
- `apps/api/prisma/schema.prisma:10-93` - persistence model.

Verification notes:

- File inventory was collected with `rg --files -g '!node_modules' -g '!dist'`.
- Git state showed the repository folder as untracked from the parent worktree (`git status --short -- .` returned `?? ./`).
