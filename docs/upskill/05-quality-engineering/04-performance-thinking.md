# 04 Performance Thinking

Measure first. Performance work without a symptom or measurement often creates complexity without value.

## Performance Domains

| Domain | Likely hotspots | How to inspect |
| --- | --- | --- |
| Render | Board refilters issues per column (`apps/web/src/App.tsx:170-171`) | React profiler, issue count fixture. |
| Network | Board payload includes project, columns, issues, team, sprint (`apps/api/src/routes/projects.ts:102-126`) | Browser network panel, response size. |
| Server | Portfolio loads all issue statuses for counts (`apps/api/src/routes/projects.ts:55-60`, `apps/api/src/routes/projects.ts:71-72`) | Query logs, timing. |
| DB | Missing composite indexes for board query (`apps/api/prisma/schema.prisma:61-82`) | Explain query, add indexes. |
| Bundle | Vite bundle output from build | `npm run build`. |
| Startup | Prisma generation/build in Docker (`apps/api/Dockerfile:8-11`) | Docker build timings. |

## How To Find Common Problems

- N+1: look for loops with Prisma calls. Current board uses includes instead (`apps/api/src/routes/projects.ts:84-89`).
- Serial async work: look for repeated awaits in loops. Seed uses `Promise.all` for independent creates (`apps/api/prisma/seed.ts:21-84`).
- Expensive renders: look for `.filter`/`.map` inside render over growing arrays (`apps/web/src/App.tsx:170-184`).
- Oversized bundles: inspect Vite build output.
- Missing indexes: align query filters/order with schema indexes (`apps/api/src/routes/projects.ts:84-85`, `apps/api/prisma/schema.prisma:61-82`).
- Cache misuse: no cache layer exists yet; future React Query keys must include project key.

## Drill

Design a load test for a project with 2,000 issues. Predict which part breaks first: DB query, JSON size, render grouping, or browser interaction.
