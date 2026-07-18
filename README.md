# BuildJira

BuildJira is now migrated to C# and ASP.NET Core. It remains a focused Jira-style project management practice app with a portfolio dashboard, project board, issue editing, demo actor context, health checks, audit events, and local persistence.

The old TypeScript/Node/Prisma/React source files are intentionally left in place as commented archival reference material for future review. The active application lives in `apps/dotnet/BuildJira.Api`.

## Quick Start

Install the .NET 8 SDK, then run:

```bash
dotnet run --project apps/dotnet/BuildJira.Api/BuildJira.Api.csproj
```

Open `http://localhost:5000` or the URL printed by ASP.NET Core. The app serves both the API and browser UI from the same process.

## Active Endpoints

- `GET /health`
- `GET /api/projects`
- `GET /api/projects/{key}/board`
- `POST /api/issues`
- `PATCH /api/issues/{id}`
- `GET /api/audit`

Mutating routes use the same demo actor convention as the original project: send `x-user-id` to impersonate a seeded user, or omit it to use the first seeded user. This is still a local-development identity model, not production authentication.

## Persistence

The migrated app uses JSON-file persistence at `apps/dotnet/BuildJira.Api/Data/buildjira-data.json` by default. If the file is missing, the app seeds the same demo users, projects, columns, sprint, issues, and initial audit event from the original implementation.

## Docker

```bash
docker compose up --build
```

Docker serves the app at `http://localhost:8080` and stores the JSON data file in the `buildjira-data` volume.

## Historical Docs

Start with [docs/dotnet-architecture.md](docs/dotnet-architecture.md) for the active C# and ASP.NET Core architecture.

The rest of the `docs/` folder still describes the original TypeScript implementation in detail. Treat those docs as historical review material until they are rewritten for the .NET architecture.
