# BuildJira .NET Architecture

This document describes the active C# and ASP.NET Core implementation after the migration from the original TypeScript, Express, Prisma, and Vite application. The historical TypeScript files are still present as commented reference material, but the running system now lives under `apps/dotnet/BuildJira.Api`.

## System Overview

BuildJira is currently a single-process ASP.NET Core application. The same process serves:

- Static browser assets from `wwwroot`.
- HTTP API endpoints under `/api`.
- A health endpoint at `/health`.
- Local JSON-file persistence for seeded demo data and runtime mutations.

The architecture is intentionally compact:

```text
Browser
  |
  | static HTML/CSS/JS and fetch calls
  v
ASP.NET Core minimal API
  |
  | singleton application store
  v
BuildJiraStore
  |
  | JSON serialization
  v
Data/buildjira-data.json
```

This keeps the app easy to run and review while preserving the same product behavior as the original practice project: portfolio loading, board loading, issue mutation, demo actor context, audit events, and health checks.

## Active Project Layout

| Path | Role |
| --- | --- |
| `apps/dotnet/BuildJira.Api/BuildJira.Api.csproj` | ASP.NET Core project targeting .NET 8. |
| `apps/dotnet/BuildJira.Api/Program.cs` | Application composition, middleware, static files, CORS, and endpoint mapping. |
| `apps/dotnet/BuildJira.Api/Models/Domain.cs` | Internal domain entities and enums. |
| `apps/dotnet/BuildJira.Api/Models/Contracts.cs` | API request and response DTOs. |
| `apps/dotnet/BuildJira.Api/Services/BuildJiraStore.cs` | In-memory state, seed data, validation, authorization checks, persistence, and mapping. |
| `apps/dotnet/BuildJira.Api/Services/BuildJiraOptions.cs` | Configuration shape for data file and CORS origin. |
| `apps/dotnet/BuildJira.Api/wwwroot` | Static frontend delivered by ASP.NET Core. |
| `apps/dotnet/BuildJira.Api/Dockerfile` | Container build and runtime definition. |
| `docker-compose.yml` | Local container entry point with persistent data volume. |

## Runtime Composition

`Program.cs` uses ASP.NET Core minimal APIs rather than MVC controllers. That is a deliberate fit for the current app size:

- Dependency injection registers `BuildJiraStore` as a singleton.
- JSON output uses camelCase properties and string enum values.
- CORS reads `BuildJira:WebOrigin` from configuration.
- Static files and fallback routing serve the browser UI.
- Endpoints are mapped directly with small route handlers.

The active route surface is:

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Returns service status and timestamp. |
| `GET /api/projects` | Returns project summaries for the portfolio/sidebar. |
| `GET /api/projects/{key}/board` | Returns one project board, columns, issues, team, and active sprint. |
| `POST /api/issues` | Creates an issue and writes an audit event. |
| `PATCH /api/issues/{id}` | Updates issue fields and writes an audit event. |
| `GET /api/audit` | Returns recent audit events for manager/admin actors. |

## Request Flow

### Board Load

1. Browser loads `wwwroot/index.html`, `styles.css`, and `app.js`.
2. `app.js` calls `GET /api/projects`.
3. The UI selects `ATLAS` or the first available project.
4. `app.js` calls `GET /api/projects/{key}/board`.
5. `BuildJiraStore.GetBoard` reads the in-memory state, maps domain entities into DTOs, and returns a board payload.
6. The frontend renders metrics, columns, issue cards, and the issue editor.

### Issue Update

1. The user changes status, assignee, priority, or story points in the issue panel.
2. `app.js` sends `PATCH /api/issues/{id}` with a JSON patch-like body.
3. `Program.cs` resolves the demo actor from `x-user-id`.
4. `BuildJiraStore.UpdateIssue` checks role authorization.
5. The store validates the supplied fields and mutates the issue.
6. The store appends an `issue.updated` audit event.
7. The full state is serialized back to the JSON data file.
8. The updated issue DTO is returned and the frontend reconciles local board state.

## Domain Model

The domain model is intentionally close to the original Prisma schema:

- `User`: project lead, reporter, assignee, or audit actor.
- `Project`: delivery container with key, health, lead, and timestamps.
- `BoardColumn`: workflow column tied to one project and one issue status.
- `Sprint`: optional active sprint context for a project.
- `Issue`: board item with status, type, priority, points, rank, assignee, reporter, and dates.
- `AuditEvent`: append-only record of project seed, issue creation, and issue update activity.

Enums are modeled directly in C#:

- `IssueStatus`
- `IssuePriority`
- `IssueType`
- `UserRole`
- `ProjectHealth`

The JSON serializer emits these enum values as strings so the API contract remains familiar to the old frontend shape, for example `IN_PROGRESS`, `PROJECT_MANAGER`, and `AT_RISK`.

## Persistence Design

The migrated app uses JSON-file persistence instead of SQLite or Entity Framework. The default file is:

```text
apps/dotnet/BuildJira.Api/Data/buildjira-data.json
```

On startup:

1. `BuildJiraStore` resolves the configured data file path.
2. If the file exists and contains JSON, it deserializes `BuildJiraState`.
3. If the file is missing or empty, the store creates seeded demo data.
4. The seeded state is immediately written to disk.

During writes:

1. The store mutates in-memory state under a lock.
2. It appends audit events when applicable.
3. It serializes the full state back to disk.

This is suitable for a compact learning app. It is not a production persistence strategy. A production version should move this boundary to a database-backed repository, likely with Entity Framework Core, migrations, transactions, and per-request scoped data access.

## Concurrency Model

`BuildJiraStore` is registered as a singleton and protects state with a private lock. This makes local concurrent requests safer than an unguarded in-memory list, but it also means:

- All reads and writes are serialized while the lock is held.
- File writes rewrite the whole state.
- The design is not horizontally scalable.
- Multiple app instances pointed at the same JSON file would race.

For the current single-process app, this tradeoff keeps implementation simple. For production, replace the singleton store with scoped services and database transactions.

## Authentication And Authorization

The current system keeps the original demo identity model:

- The caller may send `x-user-id`.
- If no header is sent, the first seeded user becomes the actor.
- If the header points to an unknown user, mutating and audit routes return `UNAUTHENTICATED`.

Role checks are enforced in `BuildJiraStore`:

- Issue create/update allows `ADMIN`, `PROJECT_MANAGER`, and `ENGINEER`.
- Audit listing allows `ADMIN` and `PROJECT_MANAGER`.
- Read routes are public inside the local app.

This is not real authentication. It is a local practice mechanism for preserving the original app behavior. A production design should replace actor resolution with verified sessions, JWTs, or OIDC, and add resource-level authorization for project membership.

## Frontend Design

The active frontend is a small static browser app:

- `index.html` defines the shell and main regions.
- `styles.css` preserves the work-tool visual style of the old UI.
- `app.js` performs fetch calls, local state management, filtering, rendering, and issue updates.

React is no longer required for the active app. This keeps the .NET migration self-contained and removes the old Node/Vite toolchain from runtime. React can be reintroduced later if the frontend grows enough to justify component-level state and routing.

## Deployment Model

The Docker path builds and runs one service:

```text
buildjira
```

The container:

- Builds the ASP.NET Core project with the .NET 8 SDK image.
- Publishes the app.
- Runs it on the ASP.NET Core runtime image.
- Exposes port `8080`.
- Stores `buildjira-data.json` in a Docker volume.

Local Docker URL:

```text
http://localhost:8080
```

Local SDK URL depends on ASP.NET Core launch settings and console output. The README points users to the URL printed by `dotnet run`.

## Current Tradeoffs

| Area | Current choice | Why it is acceptable now | Future direction |
| --- | --- | --- | --- |
| API framework | Minimal APIs | Small route surface and easy review. | Controllers or route modules if endpoints grow. |
| Persistence | JSON file | No external packages or database setup needed. | EF Core with SQLite/Postgres and migrations. |
| Store lifetime | Singleton | Simple local state management. | Scoped repository and database context. |
| Auth | Demo `x-user-id` actor | Preserves old app behavior. | OIDC/session/JWT plus resource checks. |
| Frontend | Static HTML/CSS/JS | Self-contained .NET app. | React if UI complexity increases. |
| Audit | Appended to same state file | Keeps behavior visible. | Transactional audit/outbox table. |
| Tests | Not yet ported | Migration prioritized functionality. | Add .NET integration tests with `WebApplicationFactory`. |

## Suggested Next Architecture Steps

1. Add .NET integration tests for `/health`, board load, validation failure, viewer permission denial, issue update, and audit creation.
2. Extract endpoint groups from `Program.cs` once route count grows.
3. Introduce an interface such as `IBuildJiraStore` before adding a database implementation.
4. Move validation rules into dedicated request validators or service methods as write models grow.
5. Replace JSON persistence with EF Core migrations when relational behavior matters again.
6. Update the old curriculum docs so they teach the C# implementation rather than the archived TypeScript one.
