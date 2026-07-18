# 02 Stack And Language Mastery

This repo teaches TypeScript/JavaScript, React, Node/Express, Prisma, Zod, Vite, npm workspaces, and Docker basics through a compact full-stack app.

Study order:

1. [Language runtime model](01-language-runtime-model.md)
2. [Framework mental models](02-framework-mental-models.md)
3. [Type system and contracts](03-type-system-and-contracts.md)
4. [Tooling and build system](04-tooling-and-build-system.md)

Repo anchors:

- TypeScript strictness: `tsconfig.base.json:2-18`
- Shared Zod types: `packages/shared/src/index.ts:3-101`
- React hooks and state: `apps/web/src/App.tsx:21-99`
- Express middleware: `apps/api/src/app.ts:14-45`
- Prisma schema/query layer: `apps/api/prisma/schema.prisma:10-93`, `apps/api/src/routes/projects.ts:54-237`

Verification notes:

- Inspected root, API, web, and shared manifests.
- Verified earlier that build/lint/API tests passed before generated dependencies were removed to free disk space.
