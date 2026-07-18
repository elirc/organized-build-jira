# 05 Quality Engineering

Trusted engineers make changes easy to verify and hard to break silently. This module covers tests, debugging, performance, security, and operations for this repo.

Current quality surface:

- API tests: `apps/api/test/projects.test.ts:1-34`
- Error handling: `apps/api/src/app.ts:27-45`
- Validation: `packages/shared/src/index.ts:69-88`
- Security middleware and CORS: `apps/api/src/app.ts:14-16`
- Health endpoint: `apps/api/src/routes/health.ts:6-13`
