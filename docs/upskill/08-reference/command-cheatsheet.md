# Command Cheatsheet

Status labels:

- **Verified:** command was run successfully earlier in this workspace before generated dependencies were removed to free disk space.
- **Inferred:** command is present in scripts/config but not rerun after dependency cleanup.

| Task | Command | Status | Evidence |
| --- | --- | --- | --- |
| Install dependencies | `npm install` | Verified with caveat | Root lockfile exists; install initially hit disk-space issues. |
| Generate Prisma client | `npm run db:generate` | Verified | `package.json:17`, `apps/api/package.json:11`. |
| Bootstrap DB | `npm run db:migrate` | Verified | `package.json:18`, `apps/api/package.json:12`. |
| Seed DB | `npm run db:seed` | Verified | `package.json:19`, `apps/api/package.json:13`. |
| Start both apps | `npm run dev` | Verified with caveat | `package.json:12`; worked after repairing npm shims. |
| Start API only | `npm run dev -w @buildjira/api` | Verified | `apps/api/package.json:7`. |
| Start web only | `npm run dev -w @buildjira/web` | Verified | `apps/web/package.json:7`. |
| Build all | `npm run build` | Verified | `package.json:13`. |
| Lint all | `npm run lint` | Verified | `package.json:15`. |
| Test API | `npm run test -w @buildjira/api` | Verified | `apps/api/package.json:10`. |
| Format | `npm run format` | Inferred | `package.json:16`. |
| Docker local | `docker compose up --build` | Inferred | `docker-compose.yml:1-27`. |
| API health | `Invoke-RestMethod http://localhost:4000/health` | Verified | `apps/api/src/routes/health.ts:6-13`. |
| Web smoke | `Invoke-WebRequest -UseBasicParsing http://localhost:5173` | Verified | Vite web server. |
| Projects API | `Invoke-RestMethod http://localhost:4000/api/projects` | Verified | `apps/api/src/routes/projects.ts:54-76`. |

## After Dependency Cleanup

During documentation, `node_modules` was removed to recover disk space. To run commands again:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

Then use the verified commands above.
