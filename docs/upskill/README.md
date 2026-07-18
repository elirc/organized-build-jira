# BuildJira Upskill Curriculum

This curriculum turns BuildJira into a training lab for a junior engineer growing toward mid-level and senior engineering judgment. It is for learners who already know basic programming and want to practice reading a real TypeScript/React/Node codebase, making safe changes, writing tests, and explaining tradeoffs.

BuildJira is a small TypeScript monorepo: the root workspace wires together a shared contract package, an Express API, and a Vite React UI (`package.json:7-19`). The product is a focused Jira-style project board rather than a full Jira clone (`README.md:3-5`). The API owns HTTP middleware, validation, role checks, Prisma queries, and audit writes (`apps/api/src/app.ts:14-21`, `apps/api/src/routes/projects.ts:129-218`). The web app owns project selection, board rendering, issue selection, and client-side updates (`apps/web/src/App.tsx:21-99`, `apps/web/src/App.tsx:159-193`). Shared Zod schemas are the public contract between browser and server (`packages/shared/src/index.ts:3-101`). SQLite persistence is described by Prisma models and bootstrapped by raw SQL because the local schema engine was unreliable on this machine (`apps/api/prisma/schema.prisma:10-93`, `apps/api/prisma/bootstrap.ts:5-97`). The repo is intentionally compact, which makes it good for learning cross-layer change without drowning in infrastructure.

## How To Use This

**One weekend:** read [00-fast-track.md](00-fast-track.md), run the app, trace portfolio load and issue update, make one small UI copy or validation-ticket change, and explain it back.

**Two weeks:** complete cartography, stack mastery, and three code-reading drills. Add one API test and one UI-safe contribution from [good-first tickets](06-contribution-practice/01-good-first-tickets.md).

**Eight weeks:** work through all modules, implement one mid-level feature ticket, write a short RFC, and review two fake PRs from [review katas](04-code-reading-gym/04-review-katas.md).

**Ongoing contribution practice:** keep a study journal with command output, PR drafts, failed hypotheses, review feedback, and one architecture critique per month.

## Learning Tracks

| Track | Start here | Outcome |
| --- | --- | --- |
| Codebase orientation | [system map](01-codebase-cartography/01-system-map.md) | Name major parts and trace one feature end to end. |
| Stack mastery | [language/runtime model](02-stack-and-language-mastery/01-language-runtime-model.md) | Explain TypeScript, React, Node, Prisma, and build tooling using repo examples. |
| Architecture judgment | [boundaries and layers](03-architecture-and-patterns/01-boundaries-and-layers.md) | Spot contracts, leaks, risks, and migration paths. |
| Quality engineering | [testing strategy](05-quality-engineering/01-testing-strategy.md) | Add focused tests and debug systematically. |
| Contribution readiness | [good first tickets](06-contribution-practice/01-good-first-tickets.md) | Write maintainable PRs with small blast radius. |
| Career/interview prep | [interview prep](07-career-and-collaboration/04-interview-prep-from-this-repo.md) | Turn repo work into interview-ready stories and answers. |

## Recommended Path By Level

**Brand-new junior:** `00-fast-track` -> cartography files 1-3 -> annotation drills 1-4 -> good-first tickets 1-5.

**Junior with stack familiarity:** cartography -> stack mastery -> testing docs -> two good-first tickets and one review kata.

**Mid-level engineer new to this repo:** fast-track -> key flows -> boundaries -> validation/auth -> mid-level tickets -> PR/RFC guide.

**Senior engineer doing architecture review:** system map -> architecture critique -> risk register -> senior projects -> observability/security docs.

## Conventions

- File anchors use `path:line-line` when relative markdown line links would be noisy.
- Fake code is always labeled `Illustrative fake code`; do not assume it exists in this repository.
- Drills are active exercises. Write predictions before opening answers or running commands.
- Self-grading uses observable behavior: can you trace data, name invariants, find tests, and explain risk?
- Verification notes list commands run, files inspected, and uncertainties.

## Senior Mindset

A junior asks, "How do I make it work?" A mid-level engineer asks, "Is this the right pattern for this codebase?" A senior asks, "What does this commit us to, who pays the cost, and how do we reduce risk?" Use that ladder throughout the docs: first get a working mental model, then fit existing patterns, then reason about ownership, rollback, security, and future maintainers.

## Verification Notes

- Inspected `rg --files`, root manifests, API/web/shared manifests, Prisma schema, seed/bootstrap scripts, API routes, React UI, HTTP client, tests, Docker, env, lint config.
- Verified commands before this docs pass: `npm run build`, `npm run lint`, `npm run test -w @buildjira/api`, HTTP checks for `http://localhost:5173`, `http://localhost:4000/health`, and `http://localhost:4000/api/projects`.
- Uncertainty: there is no CI config, background worker, real auth provider, rate limiter, or production migration workflow yet; docs label those as gaps or future exercises.
