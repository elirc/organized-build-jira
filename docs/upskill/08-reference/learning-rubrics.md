# Learning Rubrics

## Junior Readiness

Observable behaviors:

- Runs setup commands from `README.md:7-17`.
- Names workspaces from `package.json:7-10`.
- Traces project load from `apps/web/src/App.tsx:30-49` to `apps/api/src/routes/projects.ts:54-76`.
- Adds a small API test following `apps/api/test/projects.test.ts:15-34`.
- Explains why shared schemas matter (`packages/shared/src/index.ts:3-101`).

Self-check:

- [ ] I can run the app after installing dependencies.
- [ ] I can find the API route for a UI action.
- [ ] I can make a small change and run the relevant check.
- [ ] I can ask for help with files and hypotheses.

## Mid-Level Readiness

Observable behaviors:

- Designs a cross-layer change with schema/API/UI/tests.
- Adds validation and permission tests.
- Explains transaction risk in issue update (`apps/api/src/routes/projects.ts:196-216`).
- Finds boundary leaks such as demo auth (`apps/api/src/middleware/requestContext.ts:15-24`).
- Writes a PR description with risks and test evidence.

Self-check:

- [ ] I can identify public contract changes.
- [ ] I can debug by narrowing layer.
- [ ] I can review for correctness, maintainability, and security.
- [ ] I can avoid drive-by refactors.

## Senior Readiness

Observable behaviors:

- Critiques architecture with tradeoffs and migration paths.
- Separates confirmed risks from hypotheses.
- Designs auth/resource isolation with rollout and rollback.
- Proposes test strategy before implementation.
- Teaches others using file anchors and invariants.

Self-check:

- [ ] I can explain who pays the cost of a design.
- [ ] I can reduce blast radius.
- [ ] I can design rollback for schema/auth changes.
- [ ] I can decide what not to build yet.

## Answer Quality Rubric

| Level | Description |
| --- | --- |
| Weak | Names a file but cannot explain ownership or data shape. |
| Basic | Traces happy path with file anchors. |
| Solid | Explains validation, authorization, persistence, tests, and failure mode. |
| Strong | Adds invariant, risk, alternative, migration/rollback, and test strategy. |
