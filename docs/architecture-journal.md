# BuildJira — Architecture Journal

> Written from a senior SWE perspective, aimed at junior engineers joining the project.
> Think of this as the "why" behind the "what" you see in the code.

---

## Table of Contents

1. [The 10,000-foot view](#1-the-10000-foot-view)
2. [Monorepo with npm workspaces](#2-monorepo-with-npm-workspaces)
3. [The shared package — one schema to rule them all](#3-the-shared-package--one-schema-to-rule-them-all)
4. [Backend architecture — Express, Prisma, and the middleware chain](#4-backend-architecture--express-prisma-and-the-middleware-chain)
5. [The Actor pattern — lightweight identity without a real auth system](#5-the-actor-pattern--lightweight-identity-without-a-real-auth-system)
6. [Database design — Prisma schema decisions](#6-database-design--prisma-schema-decisions)
7. [The audit trail](#7-the-audit-trail)
8. [Frontend architecture — React, Vite, and the API client](#8-frontend-architecture--react-vite-and-the-api-client)
9. [State management without Redux](#9-state-management-without-redux)
10. [Key patterns worth memorizing](#10-key-patterns-worth-memorizing)
11. [What is missing and why it matters](#11-what-is-missing-and-why-it-matters)

---

## 1. The 10,000-foot view

BuildJira is a Jira-style project management tool. At the highest level it is a **three-layer system**:

```
┌──────────────────────────────────┐
│  apps/web  (React + Vite)        │  Browser — what users see and click
└──────────────────┬───────────────┘
                   │ HTTP (fetch / REST)
┌──────────────────▼───────────────┐
│  apps/api  (Express + Prisma)    │  Server — business rules and data access
└──────────────────┬───────────────┘
                   │ SQL (via Prisma)
┌──────────────────▼───────────────┐
│  SQLite database  (dev.db)       │  Persistence — the source of truth
└──────────────────────────────────┘

         ↕  shared by both layers ↕
┌──────────────────────────────────┐
│  packages/shared  (Zod schemas)  │  Contracts — types and validation rules
└──────────────────────────────────┘
```

The key insight is that the `shared` package sits outside both the browser and the server. It is the **contract** between the two — the agreed-upon shape of data. Both sides import from it, so if the contract changes, TypeScript immediately flags every place that breaks.

---

## 2. Monorepo with npm workspaces

**File:** `package.json` (root)

The repo uses **npm workspaces**, a built-in npm feature that lets multiple packages live in one git repository and reference each other by name rather than by relative paths.

```json
"workspaces": [
  "packages/*",
  "apps/*"
]
```

This means:
- `apps/api` can import `@buildjira/shared` as if it were an npm package from the registry — but npm resolves it to `packages/shared` locally.
- Running `npm install` from the root installs dependencies for *all* packages in one `node_modules` at the root.
- Running `npm run dev` from the root can start the API and the web app simultaneously (via `concurrently`).

**Why a monorepo?**
When the frontend and backend share types, keeping them in separate repos creates a versioning nightmare. You would have to publish the shared package to npm every time you changed a type, then update both consumers. A monorepo eliminates that entire category of friction.

**Trade-off to be aware of:** monorepos grow in complexity as teams grow. Large organizations (Google, Meta) use dedicated tooling (Bazel, Nx, Turborepo) to handle caching, affected-package detection, and parallelism. For a small project like this, raw npm workspaces are the right amount of tooling.

---

## 3. The shared package — one schema to rule them all

**File:** `packages/shared/src/index.ts`

This is arguably the most architecturally important file in the project. It uses **Zod** to define data schemas, then derives TypeScript types from those schemas.

```typescript
// Define the shape and validation rules once
export const issueSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: issueStatusSchema,
  // ...
});

// Derive the TypeScript type from the schema — zero duplication
export type Issue = z.infer<typeof issueSchema>;
```

**Why this matters:**
Without this pattern, you would write the type in one place and the validation logic in another:
```typescript
// The old painful way — two things to keep in sync
type Issue = { id: string; title: string; status: "BACKLOG" | "TODO" | ... }
function validateIssue(data: unknown) { /* manual checks */ }
```

With Zod, the type and the validator are the same artifact. If you add a new field, you add it once. TypeScript and runtime validation stay in sync automatically.

**The frontend uses this too.** The `api.ts` client in the web app calls `schema.parse(payload)` on every API response. If the server ever returns an unexpected shape — wrong field name, missing field, wrong type — the parse call throws immediately at the network boundary, rather than letting bad data silently corrupt the UI state.

---

## 4. Backend architecture — Express, Prisma, and the middleware chain

**Files:** `apps/api/src/app.ts`, `apps/api/src/server.ts`

### The `createApp()` factory pattern

Notice that `server.ts` is just 8 lines:

```typescript
const app = createApp();
app.listen(env.API_PORT, ...);
```

The real work is in `app.ts` which exports a `createApp()` function. This separation is not just tidiness — it is **testability by design**.

The test file imports `createApp()` directly:
```typescript
// apps/api/test/projects.test.ts
const app = createApp();
await request(app).get("/api/projects").expect(200);
```

When you call `app.listen()` you bind a real port. Tests that bind ports are fragile (port conflicts, CI environment issues). By importing the app factory, `supertest` can send HTTP requests directly to the Express handler in memory without a network socket ever being opened. This is a standard pattern in Express testing.

### The middleware chain

Inside `createApp()`, middleware is registered in a specific order. **Order matters in Express** — each middleware can read/modify the request before passing it to the next one via `next()`.

```
Request enters →
  1. helmet()         — sets security HTTP headers (CSP, HSTS, etc.)
  2. cors()           — allows or rejects cross-origin requests from the browser
  3. express.json()   — parses the raw HTTP body into req.body
  4. morgan()         — logs the request method, path, status, and duration
  5. attachActor      — looks up the current user and attaches them to req.actor
  6. routes           — the actual business logic
  7. 404 handler      — catches unmatched routes
  8. error handler    — catches any thrown errors
```

**Why does the error handler come last?** Express identifies an error handler by its four-argument signature `(error, req, res, next)`. When any route or middleware calls `next(error)` — or throws inside an `async` function that Express catches — Express skips all normal middleware and jumps directly to the error handler. The Zod error case is a perfect example: if the request body fails schema validation, a `ZodError` is thrown, caught by the error handler, and converted into a clean 400 response.

---

## 5. The Actor pattern — lightweight identity without a real auth system

**File:** `apps/api/src/middleware/requestContext.ts`

This project does not have real authentication (no passwords, no JWTs). Instead, it simulates identity via a custom HTTP header:

```typescript
const requestedUserId = req.header("x-user-id");
const actor = requestedUserId
  ? await prisma.user.findUnique({ where: { id: requestedUserId } })
  : await prisma.user.findFirst({ orderBy: { createdAt: "asc" } }); // fallback: first user
```

If the caller provides an `x-user-id` header, that user is the "actor." Otherwise, the first user in the database is used as a default. This lets the app work without a login flow while still having an identity attached to every mutating request.

**Two things worth noting:**

1. **TypeScript module augmentation** — the file declares `req.actor` on the Express `Request` interface. This is called *declaration merging* or *module augmentation*. Without it, TypeScript would not know `req.actor` exists, and you would get a type error every time you accessed it.

2. **`requireRole` middleware** — routes that mutate data (POST, PATCH) are wrapped with `requireRole(["ADMIN", "ENGINEER", ...])`. This is a **middleware factory**: it is a function that *returns* a middleware function. The array of allowed roles is captured in a closure and checked on every request. This is a clean RBAC (Role-Based Access Control) implementation.

---

## 6. Database design — Prisma schema decisions

**File:** `apps/api/prisma/schema.prisma`

### Why are enum fields stored as `String` in Prisma?

You will notice fields like `role`, `status`, `priority`, `health` are all `String` in the Prisma schema, even though they behave as enums. SQLite does not have a native enum type, so Prisma stores them as strings. The enum enforcement happens in the application layer via Zod (e.g., `issueStatusSchema.parse(issue.status)`).

In a production system using PostgreSQL, you would likely use Prisma's `enum` type which maps to a native Postgres enum. This is a SQLite-specific compromise.

### The `rank` field and the gap strategy

```prisma
rank  Int  @default(0)
```

When a new issue is created, its rank is calculated as:
```typescript
rank: Math.max(0, ...project.issues.map((item) => item.rank)) + 10
```

It always adds **10** rather than 1. This is intentional. If issues have ranks `[10, 20, 30]`, you can insert a new one between the first two by giving it rank `15` — without renumbering anything. With a gap of 1 (`[1, 2, 3]`), you would need to shift all subsequent ranks every time you reordered.

### `onDelete: Cascade` and `onDelete: SetNull`

The schema uses two different delete behaviors:
- `onDelete: Cascade` — deleting a Project deletes all its Issues, Columns, and Sprints (they cannot exist without a project)
- `onDelete: SetNull` — deleting a User sets `assigneeId` to null on their Issues (the issues still exist, they just become unassigned)

These are foreign-key constraints enforced at the database level, not just application logic. This means even if someone bypassed your API and ran SQL directly, the database would maintain referential integrity.

### The `AuditEvent` model

```prisma
model AuditEvent {
  actorId  String?   // nullable — user might be deleted later
  action   String    // e.g. "issue.created", "issue.updated"
  metadata String?   // JSON blob — before/after state
}
```

The `actorId` is nullable with `onDelete: SetNull`. If a user is removed, their audit history is preserved but anonymized. This is a deliberate data-retention decision — you want to keep the audit trail even when the actor no longer exists.

---

## 7. The audit trail

**File:** `apps/api/src/routes/projects.ts` (POST /issues and PATCH /issues/:id)

Every mutation (create or update) writes an `AuditEvent`:

```typescript
await prisma.auditEvent.create({
  data: {
    actorId: req.actor.id,
    action: "issue.updated",
    entity: "Issue",
    entityId: issue.id,
    metadata: JSON.stringify({ before: existing, after: input })
  }
});
```

Notice it captures both `before` and `after` state as a JSON string in the `metadata` field. This is called an **audit log** or **change log**. It answers the question "who changed what, and to what?" — which is critical for debugging, compliance, and accountability in real products.

**The trade-off here:** storing the diff as a raw JSON string in a single column is simple to implement, but hard to query. If you wanted to ask "show me all issues where priority was changed from HIGH to CRITICAL," you would need to scan and parse every row. A more mature system would store diffs in structured columns or use a dedicated event-sourcing table.

---

## 8. Frontend architecture — React, Vite, and the API client

**Files:** `apps/web/src/lib/api.ts`, `apps/web/src/App.tsx`

### The `request` helper

```typescript
async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, { ...init, headers: { "content-type": "application/json", ... } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message ?? "Request failed");
  return schema.parse(payload); // runtime validation at the boundary
}
```

This is a **generic typed wrapper** over the native `fetch` API. It does three things every HTTP call needs:
1. Attaches JSON headers automatically
2. Converts non-2xx responses into thrown errors (fetch does not do this by default)
3. Validates and types the response with Zod

Every public function (`getProjects`, `getBoard`, `updateIssue`) calls this helper with its specific Zod schema. The TypeScript return type is inferred automatically — no casting needed.

**Notice** `updateIssue` reuses the schema from the shared package cleverly:
```typescript
boardResponseSchema.shape.issues.element
```
Rather than duplicating the `issueSchema`, it drills into `boardResponseSchema` to extract the element type of the issues array. This is a Zod API pattern that keeps things DRY.

### Vite as the build tool

Vite replaces webpack for this project. Its key advantage is **instant hot module replacement (HMR)** during development — file saves reflect in the browser in under 100ms. In production, Vite uses Rollup to bundle and tree-shake the output. The `VITE_API_URL` environment variable is injected at build time (note the `VITE_` prefix — Vite only exposes env vars with that prefix to the client for security).

---

## 9. State management without Redux

**File:** `apps/web/src/App.tsx`

The app uses **React's built-in `useState` and `useEffect`** — no Redux, no Zustand, no React Query. This is the right call for an app of this size. Let's look at the key patterns:

### Two-phase data loading with separate effects

```typescript
// Effect 1: load the project list (runs once on mount)
useEffect(() => { loadPortfolio(); }, []);

// Effect 2: load the board (runs whenever the selected project changes)
useEffect(() => { loadBoard(); }, [selectedProjectKey]);
```

This separation is intentional. The project list is a sidebar concern; the board is the main workspace. Keeping them in separate effects means changing the selected project only re-fetches the board, not the project list.

### The `isMounted` flag — preventing memory leaks

```typescript
useEffect(() => {
  let isMounted = true;
  async function loadBoard() {
    const data = await getBoard(selectedProjectKey);
    if (isMounted) setBoard(data); // only update state if still mounted
  }
  loadBoard();
  return () => { isMounted = false; }; // cleanup: mark as unmounted
}, [selectedProjectKey]);
```

This pattern prevents a **React memory leak warning** and a subtle bug. If the user navigates away before the fetch completes, the component unmounts. The cleanup function sets `isMounted = false`. When the fetch eventually resolves, the `if (isMounted)` guard prevents calling `setState` on an unmounted component.

### Optimistic-style local mutation

When an issue is updated, the API call and the local state update happen together:

```typescript
async function mutateIssue(issueId: string, input: UpdateIssueInput) {
  const nextIssue = await updateIssue(issueId, input); // wait for server
  setBoard((current) => ({
    ...current,
    issues: current.issues.map((issue) => issue.id === nextIssue.id ? nextIssue : issue)
  }));
}
```

This is **not** truly optimistic (the UI waits for the server response before updating). Truly optimistic updates would update the UI immediately, then rollback on error. The current pattern is simpler and avoids dealing with rollback logic. A `Loader2` spinner in the panel signals the save is in progress.

### `useMemo` for filtered issues

```typescript
const filteredIssues = useMemo(() => {
  const normalized = query.trim().toLowerCase();
  if (!board || !normalized) return board?.issues ?? [];
  return board.issues.filter((issue) => `${issue.key} ${issue.title} ${issue.assignee?.name ?? ""}`.toLowerCase().includes(normalized));
}, [board, query]);
```

`useMemo` caches the filtered result and only recomputes when `board` or `query` changes. Without this, the filter would run on every render — harmless with 50 issues, noticeable with 5000. It is a good habit to memoize derived data that depends on props or state.

---

## 10. Key patterns worth memorizing

| Pattern | Where | Why |
|---|---|---|
| Zod schema → inferred type | `packages/shared` | One source of truth for shape and validation |
| `createApp()` factory | `apps/api/src/app.ts` | Makes Express app testable without binding a port |
| Middleware chain | `apps/api/src/app.ts` | Separation of cross-cutting concerns (auth, logging, error handling) |
| Module augmentation | `requestContext.ts` | Extend third-party types (`req.actor`) safely |
| Middleware factory (`requireRole`) | `requestContext.ts` | Parameterized middleware via closure |
| Rank gaps of 10 | `routes/projects.ts` | Allows insertion without full re-sort |
| `isMounted` flag | `App.tsx` | Prevents state updates after unmount |
| `schema.parse()` at the boundary | `api.ts` | Fails fast on bad data at the network edge |

---

## 11. What is missing and why it matters

This is a learning project, so some production concerns are intentionally absent. Here is what you would add before shipping to real users:

**Real authentication.** The `x-user-id` header trick is fine for development but anyone could spoof any user's identity. In production you would use JWTs or session cookies, verified against a secret key.

**Database for production.** SQLite is a file-based database that does not support concurrent writes well. A real deployment would use PostgreSQL or MySQL, with Prisma's connection pooling configured via `pgBouncer` or similar.

**Transactions on multi-step writes.** The issue creation route does two database writes: `prisma.issue.create` and `prisma.auditEvent.create`. If the second write fails, the issue exists but has no audit record. In production, these should be wrapped in a `prisma.$transaction(...)` call to make them atomic — either both succeed or neither does.

**Pagination.** The board query fetches all issues for a project in one go. For a project with thousands of issues, this will be slow and memory-intensive. Cursor-based pagination would be the correct fix.

**Error boundaries.** The frontend has an `ErrorState` component but no React error boundary. If a render throws an unhandled exception, the whole page goes blank. A `<ErrorBoundary>` wrapper would catch render errors and show a graceful fallback.

---

*Journal entry — 2026-06-01. Updated after full codebase review.*
