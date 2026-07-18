# BuildJira — Feature User Stories & Implementation Plans

> 20 user stories for new features, each with a step-by-step implementation guide
> written for a junior software engineer working in the active .NET + vanilla JS stack.
>
> **Stack reference:** C# / ASP.NET Core Minimal APIs · JSON file persistence · Vanilla JS / HTML / CSS
> **Key files:** `Models/Domain.cs` · `Models/Contracts.cs` · `Services/BuildJiraStore.cs` · `Program.cs` · `wwwroot/app.js` · `wwwroot/index.html` · `wwwroot/styles.css`

---

## How to read these stories

Each story follows this structure:

- **User Story** — "As a [role] I want [feature] so that [benefit]"
- **Acceptance Criteria** — testable conditions that define "done"
- **Implementation Plan** — numbered steps covering backend model, store logic, API endpoint, and frontend UI

---

---

## Story 1 — Issue Comments

**As an engineer, I want to post comments on issues so that my team can discuss implementation details without leaving the tool.**

### Acceptance Criteria
- Any logged-in user can post a comment on an issue
- Comments show the author's name, avatar, and a timestamp
- Comments are listed oldest-first below the issue description
- A user can delete their own comment (admins can delete any)
- Comment text is required, max 2000 characters
- An audit event is created for each comment posted

### Implementation Plan

#### Step 1 — Add the `Comment` domain model (`Models/Domain.cs`)

Add a new class after the `AuditEvent` class:

```csharp
public class Comment
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string IssueId { get; set; } = "";
    public string AuthorId { get; set; } = "";
    public string Body { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
```

Add a `Comments` list to `BuildJiraState`:

```csharp
public List<Comment> Comments { get; set; } = new();
```

#### Step 2 — Add DTOs (`Models/Contracts.cs`)

```csharp
// Request to create a comment
public record CreateCommentRequest(string Body);

// Response DTO sent to the client
public record CommentDto(
    string Id,
    string IssueId,
    string AuthorId,
    string AuthorName,
    string? AuthorAvatarUrl,
    string Body,
    DateTime CreatedAt
);
```

#### Step 3 — Add store methods (`Services/BuildJiraStore.cs`)

Inside `BuildJiraStore`, add:

```csharp
public List<CommentDto> GetComments(string issueId)
{
    lock (_lock)
    {
        return _state.Comments
            .Where(c => c.IssueId == issueId)
            .OrderBy(c => c.CreatedAt)
            .Select(c =>
            {
                var author = _state.Users.FirstOrDefault(u => u.Id == c.AuthorId);
                return new CommentDto(c.Id, c.IssueId, c.AuthorId,
                    author?.Name ?? "Unknown", author?.AvatarUrl, c.Body, c.CreatedAt);
            })
            .ToList();
    }
}

public CommentDto AddComment(string issueId, string actorId, string body)
{
    if (string.IsNullOrWhiteSpace(body) || body.Length > 2000)
        throw new ArgumentException("Comment body must be 1–2000 characters.");

    lock (_lock)
    {
        var issue = _state.Issues.FirstOrDefault(i => i.Id == issueId)
            ?? throw new KeyNotFoundException("Issue not found.");

        var comment = new Comment { IssueId = issueId, AuthorId = actorId, Body = body.Trim() };
        _state.Comments.Add(comment);

        _state.AuditEvents.Add(new AuditEvent
        {
            ActorId = actorId, Action = "COMMENT_ADDED",
            Entity = "Issue", EntityId = issueId,
            Metadata = $"{{\"commentId\":\"{comment.Id}\"}}"
        });

        Save();

        var author = _state.Users.FirstOrDefault(u => u.Id == actorId);
        return new CommentDto(comment.Id, issueId, actorId,
            author?.Name ?? "Unknown", author?.AvatarUrl, comment.Body, comment.CreatedAt);
    }
}

public void DeleteComment(string commentId, string actorId)
{
    lock (_lock)
    {
        var comment = _state.Comments.FirstOrDefault(c => c.Id == commentId)
            ?? throw new KeyNotFoundException("Comment not found.");

        var actor = _state.Users.FirstOrDefault(u => u.Id == actorId);
        bool isOwner = comment.AuthorId == actorId;
        bool isAdmin = actor?.Role is UserRole.ADMIN or UserRole.PROJECT_MANAGER;

        if (!isOwner && !isAdmin)
            throw new UnauthorizedAccessException("You can only delete your own comments.");

        _state.Comments.Remove(comment);
        Save();
    }
}
```

#### Step 4 — Wire endpoints (`Program.cs`)

```csharp
app.MapGet("/api/issues/{id}/comments", (string id, BuildJiraStore store) =>
    Results.Ok(store.GetComments(id)));

app.MapPost("/api/issues/{id}/comments", (string id, CreateCommentRequest req,
    HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    var dto = store.AddComment(id, actorId, req.Body);
    return Results.Created($"/api/issues/{id}/comments/{dto.Id}", dto);
});

app.MapDelete("/api/issues/{id}/comments/{commentId}", (string id, string commentId,
    HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    store.DeleteComment(commentId, actorId);
    return Results.NoContent();
});
```

#### Step 5 — Frontend: render comments in the issue panel (`wwwroot/app.js`)

In the function that renders the right-side issue panel (around the `renderPanel` function), add a comments section below the existing fields:

```javascript
async function loadComments(issueId) {
  const comments = await request(`/api/issues/${issueId}/comments`);
  const container = document.getElementById('comments-list');
  container.innerHTML = comments.map(c => `
    <div class="comment" data-id="${c.id}">
      <img class="avatar" src="${c.authorAvatarUrl || '/avatar-placeholder.png'}" />
      <div class="comment-body">
        <strong>${c.authorName}</strong>
        <span class="comment-time">${new Date(c.createdAt).toLocaleString()}</span>
        <p>${c.body}</p>
        <button class="btn-link" onclick="deleteComment('${c.id}', '${issueId}')">Delete</button>
      </div>
    </div>
  `).join('');
}

async function postComment(issueId) {
  const input = document.getElementById('comment-input');
  if (!input.value.trim()) return;
  await request(`/api/issues/${issueId}/comments`, 'POST', { body: input.value.trim() });
  input.value = '';
  await loadComments(issueId);
}

async function deleteComment(commentId, issueId) {
  await request(`/api/issues/${issueId}/comments/${commentId}`, 'DELETE');
  await loadComments(issueId);
}
```

#### Step 6 — Frontend: add HTML for the comment form (`wwwroot/index.html`)

Inside the `#issue-panel` section, add below the existing fields:

```html
<div class="panel-section">
  <h4>Comments</h4>
  <div id="comments-list"></div>
  <textarea id="comment-input" placeholder="Add a comment…" rows="3"></textarea>
  <button onclick="postComment(currentIssueId)">Post</button>
</div>
```

#### Step 7 — Add CSS (`wwwroot/styles.css`)

```css
.comment { display: flex; gap: 10px; margin-bottom: 12px; }
.comment .avatar { width: 32px; height: 32px; border-radius: 50%; }
.comment-body { flex: 1; }
.comment-time { font-size: 11px; color: var(--text-muted); margin-left: 8px; }
```

---

---

## Story 2 — Sprint Management (Create / Start / Close)

**As a project manager, I want to create, start, and close sprints so that I can plan work in time-boxed cycles.**

### Acceptance Criteria
- PMs and admins can create a sprint with a name, goal, start date, and end date
- Only one sprint can be "active" per project at a time
- Closing a sprint moves all incomplete issues to the backlog
- The active sprint name appears in the board metrics row
- An audit event is logged for sprint state changes

### Implementation Plan

#### Step 1 — Add sprint status to the `Sprint` model (`Models/Domain.cs`)

Add a new enum:

```csharp
public enum SprintStatus { PLANNING, ACTIVE, CLOSED }
```

Add `Status` to the `Sprint` class:

```csharp
public SprintStatus Status { get; set; } = SprintStatus.PLANNING;
```

#### Step 2 — Add DTOs (`Models/Contracts.cs`)

```csharp
public record CreateSprintRequest(
    string Name,
    string? Goal,
    DateTime StartsAt,
    DateTime EndsAt,
    string ProjectId
);

public record SprintDto(
    string Id, string Name, string? Goal,
    DateTime StartsAt, DateTime EndsAt,
    string ProjectId, string Status
);
```

#### Step 3 — Add store methods (`Services/BuildJiraStore.cs`)

```csharp
public SprintDto CreateSprint(CreateSprintRequest req, string actorId)
{
    RequireRole(actorId, UserRole.ADMIN, UserRole.PROJECT_MANAGER);
    lock (_lock)
    {
        var sprint = new Sprint
        {
            Name = req.Name, Goal = req.Goal,
            StartsAt = req.StartsAt, EndsAt = req.EndsAt,
            ProjectId = req.ProjectId, Status = SprintStatus.PLANNING
        };
        _state.Sprints.Add(sprint);
        Save();
        return MapSprintDto(sprint);
    }
}

public SprintDto StartSprint(string sprintId, string actorId)
{
    RequireRole(actorId, UserRole.ADMIN, UserRole.PROJECT_MANAGER);
    lock (_lock)
    {
        var sprint = GetSprintOrThrow(sprintId);
        var hasActive = _state.Sprints.Any(s =>
            s.ProjectId == sprint.ProjectId && s.Status == SprintStatus.ACTIVE);
        if (hasActive) throw new InvalidOperationException("A sprint is already active for this project.");
        sprint.Status = SprintStatus.ACTIVE;
        Save();
        return MapSprintDto(sprint);
    }
}

public SprintDto CloseSprint(string sprintId, string actorId)
{
    RequireRole(actorId, UserRole.ADMIN, UserRole.PROJECT_MANAGER);
    lock (_lock)
    {
        var sprint = GetSprintOrThrow(sprintId);
        // Move incomplete issues back to backlog
        foreach (var issue in _state.Issues.Where(i =>
            i.SprintId == sprintId && i.Status != IssueStatus.DONE))
        {
            issue.SprintId = null;
            issue.Status = IssueStatus.BACKLOG;
        }
        sprint.Status = SprintStatus.CLOSED;
        Save();
        return MapSprintDto(sprint);
    }
}

private Sprint GetSprintOrThrow(string id) =>
    _state.Sprints.FirstOrDefault(s => s.Id == id)
    ?? throw new KeyNotFoundException("Sprint not found.");

private SprintDto MapSprintDto(Sprint s) =>
    new(s.Id, s.Name, s.Goal, s.StartsAt, s.EndsAt, s.ProjectId, s.Status.ToString());
```

#### Step 4 — Wire endpoints (`Program.cs`)

```csharp
app.MapGet("/api/projects/{key}/sprints", (string key, BuildJiraStore store) =>
    Results.Ok(store.GetSprintsForProject(key)));

app.MapPost("/api/sprints", (CreateSprintRequest req, HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    return Results.Created("", store.CreateSprint(req, actorId));
});

app.MapPost("/api/sprints/{id}/start", (string id, HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    return Results.Ok(store.StartSprint(id, actorId));
});

app.MapPost("/api/sprints/{id}/close", (string id, HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    return Results.Ok(store.CloseSprint(id, actorId));
});
```

#### Step 5 — Frontend: Add a Sprint Management modal (`wwwroot/index.html`)

Add a modal dialog triggered from the top bar:

```html
<button id="btn-sprint-manage" onclick="openSprintModal()">Manage Sprint</button>

<dialog id="sprint-modal">
  <h3>Sprint Management</h3>
  <div id="sprint-list"></div>
  <hr/>
  <h4>Create New Sprint</h4>
  <label>Name <input id="sprint-name" /></label>
  <label>Goal <input id="sprint-goal" /></label>
  <label>Start <input type="date" id="sprint-start" /></label>
  <label>End <input type="date" id="sprint-end" /></label>
  <button onclick="createSprint()">Create</button>
  <button onclick="document.getElementById('sprint-modal').close()">Close</button>
</dialog>
```

#### Step 6 — Frontend JS (`wwwroot/app.js`)

```javascript
async function openSprintModal() {
  const sprints = await request(`/api/projects/${currentProjectKey}/sprints`);
  document.getElementById('sprint-list').innerHTML = sprints.map(s => `
    <div class="sprint-row">
      <strong>${s.name}</strong> <span class="badge">${s.status}</span>
      ${s.status === 'PLANNING' ? `<button onclick="startSprint('${s.id}')">Start</button>` : ''}
      ${s.status === 'ACTIVE' ? `<button onclick="closeSprint('${s.id}')">Close Sprint</button>` : ''}
    </div>
  `).join('');
  document.getElementById('sprint-modal').showModal();
}

async function createSprint() {
  await request('/api/sprints', 'POST', {
    name: document.getElementById('sprint-name').value,
    goal: document.getElementById('sprint-goal').value,
    startsAt: document.getElementById('sprint-start').value,
    endsAt: document.getElementById('sprint-end').value,
    projectId: currentProjectId
  });
  await openSprintModal();
}

async function startSprint(id) {
  await request(`/api/sprints/${id}/start`, 'POST');
  await loadBoard();
  await openSprintModal();
}

async function closeSprint(id) {
  if (!confirm('Close sprint? Incomplete issues return to backlog.')) return;
  await request(`/api/sprints/${id}/close`, 'POST');
  await loadBoard();
  await openSprintModal();
}
```

---

---

## Story 3 — Issue Linking / Dependencies

**As an engineer, I want to link issues together (blocks / is blocked by / relates to) so that I can track dependencies between work items.**

### Acceptance Criteria
- A user can add a link between two issues with a relationship type
- Relationship types: BLOCKS, IS_BLOCKED_BY, RELATES_TO, DUPLICATES
- Linked issues are shown in the issue detail panel
- Removing a link removes it from both sides
- An audit event is created for each link added/removed

### Implementation Plan

#### Step 1 — Add domain model (`Models/Domain.cs`)

```csharp
public enum LinkType { BLOCKS, IS_BLOCKED_BY, RELATES_TO, DUPLICATES }

public class IssueLink
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string SourceIssueId { get; set; } = "";
    public string TargetIssueId { get; set; } = "";
    public LinkType Type { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

Add to `BuildJiraState`:

```csharp
public List<IssueLink> IssueLinks { get; set; } = new();
```

#### Step 2 — Add DTOs (`Models/Contracts.cs`)

```csharp
public record CreateIssueLinkRequest(string SourceIssueId, string TargetIssueId, string Type);

public record IssueLinkDto(
    string Id, string SourceIssueId, string SourceKey,
    string TargetIssueId, string TargetKey, string TargetTitle, string Type
);
```

#### Step 3 — Add store methods (`Services/BuildJiraStore.cs`)

```csharp
public IssueLinkDto AddIssueLink(CreateIssueLinkRequest req, string actorId)
{
    lock (_lock)
    {
        var source = _state.Issues.FirstOrDefault(i => i.Id == req.SourceIssueId)
            ?? throw new KeyNotFoundException("Source issue not found.");
        var target = _state.Issues.FirstOrDefault(i => i.Id == req.TargetIssueId)
            ?? throw new KeyNotFoundException("Target issue not found.");

        if (!Enum.TryParse<LinkType>(req.Type, out var linkType))
            throw new ArgumentException("Invalid link type.");

        // Prevent duplicate links
        bool duplicate = _state.IssueLinks.Any(l =>
            l.SourceIssueId == req.SourceIssueId &&
            l.TargetIssueId == req.TargetIssueId &&
            l.Type == linkType);
        if (duplicate) throw new InvalidOperationException("Link already exists.");

        var link = new IssueLink
        {
            SourceIssueId = req.SourceIssueId,
            TargetIssueId = req.TargetIssueId,
            Type = linkType
        };
        _state.IssueLinks.Add(link);

        _state.AuditEvents.Add(new AuditEvent
        {
            ActorId = actorId, Action = "ISSUE_LINKED",
            Entity = "Issue", EntityId = req.SourceIssueId,
            Metadata = $"{{\"targetId\":\"{req.TargetIssueId}\",\"type\":\"{req.Type}\"}}"
        });

        Save();
        return MapLinkDto(link, source, target);
    }
}

public List<IssueLinkDto> GetLinksForIssue(string issueId)
{
    lock (_lock)
    {
        return _state.IssueLinks
            .Where(l => l.SourceIssueId == issueId || l.TargetIssueId == issueId)
            .Select(l =>
            {
                var source = _state.Issues.First(i => i.Id == l.SourceIssueId);
                var target = _state.Issues.First(i => i.Id == l.TargetIssueId);
                return MapLinkDto(l, source, target);
            })
            .ToList();
    }
}

public void RemoveIssueLink(string linkId, string actorId)
{
    lock (_lock)
    {
        var link = _state.IssueLinks.FirstOrDefault(l => l.Id == linkId)
            ?? throw new KeyNotFoundException("Link not found.");
        _state.IssueLinks.Remove(link);
        Save();
    }
}

private IssueLinkDto MapLinkDto(IssueLink l, Issue source, Issue target) =>
    new(l.Id, source.Id, source.Key, target.Id, target.Key, target.Title, l.Type.ToString());
```

#### Step 4 — Wire endpoints (`Program.cs`)

```csharp
app.MapGet("/api/issues/{id}/links", (string id, BuildJiraStore store) =>
    Results.Ok(store.GetLinksForIssue(id)));

app.MapPost("/api/issue-links", (CreateIssueLinkRequest req, HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    return Results.Created("", store.AddIssueLink(req, actorId));
});

app.MapDelete("/api/issue-links/{id}", (string id, HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    store.RemoveIssueLink(id, actorId);
    return Results.NoContent();
});
```

#### Step 5 — Frontend: render links section in issue panel (`wwwroot/app.js`)

```javascript
async function loadIssueLinks(issueId) {
  const links = await request(`/api/issues/${issueId}/links`);
  document.getElementById('links-list').innerHTML = links.map(l => `
    <div class="link-row">
      <span class="badge badge-link">${l.type.replace('_', ' ')}</span>
      <a href="#" onclick="selectIssue('${l.targetIssueId}')">${l.targetKey}: ${l.targetTitle}</a>
      <button onclick="removeLink('${l.id}', '${issueId}')">×</button>
    </div>
  `).join('');
}

async function addIssueLink(issueId) {
  const targetKey = document.getElementById('link-target-key').value.trim();
  const type = document.getElementById('link-type').value;
  // Resolve key to ID by searching the current board's issues
  const target = currentIssues.find(i => i.key === targetKey.toUpperCase());
  if (!target) { alert('Issue key not found on this board.'); return; }
  await request('/api/issue-links', 'POST', {
    sourceIssueId: issueId,
    targetIssueId: target.id,
    type
  });
  await loadIssueLinks(issueId);
}

async function removeLink(linkId, issueId) {
  await request(`/api/issue-links/${linkId}`, 'DELETE');
  await loadIssueLinks(issueId);
}
```

---

---

## Story 4 — Time Tracking (Log Work)

**As an engineer, I want to log hours worked on an issue so that my team has visibility into actual effort versus estimates.**

### Acceptance Criteria
- Engineers can log a work entry: hours spent and an optional description
- Logged hours are summed and displayed as "Xh logged" on the issue card
- Work log entries list in the issue panel with author and timestamp
- Story points remain separate from time tracking
- The original estimate (story points) is shown alongside time logged

### Implementation Plan

#### Step 1 — Add `WorkLog` model (`Models/Domain.cs`)

```csharp
public class WorkLog
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string IssueId { get; set; } = "";
    public string AuthorId { get; set; } = "";
    public decimal HoursSpent { get; set; }
    public string? Description { get; set; }
    public DateTime LoggedAt { get; set; } = DateTime.UtcNow;
}
```

Add to `BuildJiraState`:

```csharp
public List<WorkLog> WorkLogs { get; set; } = new();
```

#### Step 2 — Add DTOs (`Models/Contracts.cs`)

```csharp
public record LogWorkRequest(decimal HoursSpent, string? Description);

public record WorkLogDto(
    string Id, string IssueId, string AuthorId, string AuthorName,
    decimal HoursSpent, string? Description, DateTime LoggedAt
);
```

#### Step 3 — Add store methods (`Services/BuildJiraStore.cs`)

```csharp
public WorkLogDto LogWork(string issueId, LogWorkRequest req, string actorId)
{
    if (req.HoursSpent <= 0 || req.HoursSpent > 24)
        throw new ArgumentException("HoursSpent must be between 0.1 and 24.");
    if (req.Description?.Length > 500)
        throw new ArgumentException("Description max 500 characters.");

    lock (_lock)
    {
        var issue = _state.Issues.FirstOrDefault(i => i.Id == issueId)
            ?? throw new KeyNotFoundException("Issue not found.");

        var log = new WorkLog
        {
            IssueId = issueId,
            AuthorId = actorId,
            HoursSpent = req.HoursSpent,
            Description = req.Description
        };
        _state.WorkLogs.Add(log);
        Save();

        var author = _state.Users.FirstOrDefault(u => u.Id == actorId);
        return new WorkLogDto(log.Id, issueId, actorId, author?.Name ?? "Unknown",
            log.HoursSpent, log.Description, log.LoggedAt);
    }
}

public List<WorkLogDto> GetWorkLogs(string issueId)
{
    lock (_lock)
    {
        return _state.WorkLogs
            .Where(l => l.IssueId == issueId)
            .OrderBy(l => l.LoggedAt)
            .Select(l =>
            {
                var author = _state.Users.FirstOrDefault(u => u.Id == l.AuthorId);
                return new WorkLogDto(l.Id, l.IssueId, l.AuthorId,
                    author?.Name ?? "Unknown", l.HoursSpent, l.Description, l.LoggedAt);
            })
            .ToList();
    }
}

// Add this helper to IssueDto so the board card can show total hours
public decimal GetTotalHoursLogged(string issueId)
{
    lock (_lock) => _state.WorkLogs.Where(l => l.IssueId == issueId).Sum(l => l.HoursSpent);
}
```

#### Step 4 — Wire endpoints (`Program.cs`)

```csharp
app.MapGet("/api/issues/{id}/worklogs", (string id, BuildJiraStore store) =>
    Results.Ok(store.GetWorkLogs(id)));

app.MapPost("/api/issues/{id}/worklogs", (string id, LogWorkRequest req,
    HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    return Results.Created("", store.LogWork(id, req, actorId));
});
```

#### Step 5 — Extend `IssueDto` with total hours (`Models/Contracts.cs`)

Add `TotalHoursLogged` field to `IssueDto` and populate it in the board load:

```csharp
// In the existing IssueDto record, add:
decimal TotalHoursLogged
```

Populate in `BuildJiraStore.GetBoard()`:

```csharp
TotalHoursLogged = _state.WorkLogs.Where(l => l.IssueId == i.Id).Sum(l => l.HoursSpent)
```

#### Step 6 — Frontend: show hours on issue cards (`wwwroot/app.js`)

In `renderBoard()`, within the issue card template, add:

```javascript
${issue.totalHoursLogged > 0 ? `<span class="hours-badge">${issue.totalHoursLogged}h</span>` : ''}
```

In the panel, add a work log section with a form to log time:

```javascript
async function loadWorkLogs(issueId) {
  const logs = await request(`/api/issues/${issueId}/worklogs`);
  const total = logs.reduce((sum, l) => sum + l.hoursSpent, 0);
  document.getElementById('worklog-total').textContent = `Total: ${total}h logged`;
  document.getElementById('worklog-list').innerHTML = logs.map(l =>
    `<div>${l.authorName} logged ${l.hoursSpent}h on ${new Date(l.loggedAt).toLocaleDateString()}
     ${l.description ? ` — ${l.description}` : ''}</div>`
  ).join('');
}

async function submitWorkLog(issueId) {
  const hours = parseFloat(document.getElementById('log-hours').value);
  const desc = document.getElementById('log-desc').value;
  await request(`/api/issues/${issueId}/worklogs`, 'POST', { hoursSpent: hours, description: desc });
  await loadWorkLogs(issueId);
}
```

---

---

## Story 5 — Burndown Chart (Reports Page)

**As a project manager, I want to see a sprint burndown chart so that I can track whether the team is on pace to complete all committed work.**

### Acceptance Criteria
- A "Reports" nav item opens a reports view (it is currently a stub in the sidebar)
- The burndown chart shows ideal vs actual remaining story points per day
- Data is scoped to the currently active sprint
- If no sprint is active, a message is shown instead
- The chart updates when navigating between projects

### Implementation Plan

#### Step 1 — Add `BurndownPoint` to contracts (`Models/Contracts.cs`)

```csharp
public record BurndownPoint(string Date, int Ideal, int Actual);

public record BurndownResponse(
    string SprintName,
    DateTime StartsAt,
    DateTime EndsAt,
    int TotalPoints,
    List<BurndownPoint> Points
);
```

#### Step 2 — Add a snapshot model for tracking daily point completion (`Models/Domain.cs`)

```csharp
public class DailySnapshot
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string SprintId { get; set; } = "";
    public DateTime Date { get; set; }
    public int RemainingPoints { get; set; }
}
```

Add to `BuildJiraState`:

```csharp
public List<DailySnapshot> DailySnapshots { get; set; } = new();
```

#### Step 3 — Create a nightly snapshot method (`Services/BuildJiraStore.cs`)

```csharp
public void TakeSnapshotForActiveSprints()
{
    lock (_lock)
    {
        var today = DateTime.UtcNow.Date;
        foreach (var sprint in _state.Sprints.Where(s => s.Status == SprintStatus.ACTIVE))
        {
            // Only one snapshot per sprint per day
            bool exists = _state.DailySnapshots.Any(d =>
                d.SprintId == sprint.Id && d.Date.Date == today);
            if (exists) continue;

            int remaining = _state.Issues
                .Where(i => i.SprintId == sprint.Id && i.Status != IssueStatus.DONE)
                .Sum(i => i.StoryPoints ?? 0);

            _state.DailySnapshots.Add(new DailySnapshot
            {
                SprintId = sprint.Id,
                Date = today,
                RemainingPoints = remaining
            });
        }
        Save();
    }
}

public BurndownResponse? GetBurndown(string projectKey)
{
    lock (_lock)
    {
        var project = _state.Projects.FirstOrDefault(p => p.Key == projectKey)
            ?? throw new KeyNotFoundException("Project not found.");

        var sprint = _state.Sprints.FirstOrDefault(s =>
            s.ProjectId == project.Id && s.Status == SprintStatus.ACTIVE);
        if (sprint == null) return null;

        int totalPoints = _state.Issues
            .Where(i => i.SprintId == sprint.Id)
            .Sum(i => i.StoryPoints ?? 0);

        int durationDays = (int)(sprint.EndsAt - sprint.StartsAt).TotalDays + 1;
        double pointsPerDay = durationDays > 0 ? (double)totalPoints / durationDays : 0;

        var points = new List<BurndownPoint>();
        for (int day = 0; day < durationDays; day++)
        {
            var date = sprint.StartsAt.AddDays(day);
            int ideal = (int)Math.Round(totalPoints - pointsPerDay * day);
            var snapshot = _state.DailySnapshots
                .Where(d => d.SprintId == sprint.Id && d.Date.Date == date.Date)
                .OrderByDescending(d => d.Date)
                .FirstOrDefault();
            int actual = snapshot?.RemainingPoints ?? -1; // -1 = no data yet
            points.Add(new BurndownPoint(date.ToString("yyyy-MM-dd"), ideal, actual));
        }

        return new BurndownResponse(sprint.Name, sprint.StartsAt, sprint.EndsAt, totalPoints, points);
    }
}
```

#### Step 4 — Wire endpoint + snapshot background job (`Program.cs`)

```csharp
app.MapGet("/api/projects/{key}/burndown", (string key, BuildJiraStore store) =>
{
    var result = store.GetBurndown(key);
    return result == null ? Results.NoContent() : Results.Ok(result);
});

// Register a background service for daily snapshots
builder.Services.AddHostedService<SnapshotService>();
```

Create `Services/SnapshotService.cs`:

```csharp
public class SnapshotService : BackgroundService
{
    private readonly IServiceProvider _services;

    public SnapshotService(IServiceProvider services) => _services = services;

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            using var scope = _services.CreateScope();
            var store = scope.ServiceProvider.GetRequiredService<BuildJiraStore>();
            store.TakeSnapshotForActiveSprints();

            // Wait until next midnight UTC
            var now = DateTime.UtcNow;
            var nextMidnight = now.Date.AddDays(1);
            await Task.Delay(nextMidnight - now, ct);
        }
    }
}
```

#### Step 5 — Frontend: reports view (`wwwroot/app.js`)

```javascript
async function showReports() {
  document.getElementById('board-view').style.display = 'none';
  document.getElementById('reports-view').style.display = 'block';
  const data = await request(`/api/projects/${currentProjectKey}/burndown`);
  if (!data) {
    document.getElementById('burndown-container').innerHTML = '<p>No active sprint.</p>';
    return;
  }
  renderBurndownChart(data);
}

function renderBurndownChart(data) {
  // Uses an inline SVG chart — no external library required
  const width = 600, height = 300, padding = 40;
  const points = data.points.filter(p => p.actual >= 0);
  const maxY = data.totalPoints;

  const toX = (i) => padding + (i / (data.points.length - 1)) * (width - padding * 2);
  const toY = (v) => height - padding - (v / maxY) * (height - padding * 2);

  const idealPath = data.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p.ideal)}`).join(' ');
  const actualPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(data.points.indexOf(p))},${toY(p.actual)}`).join(' ');

  document.getElementById('burndown-container').innerHTML = `
    <h3>Burndown: ${data.sprintName}</h3>
    <svg width="${width}" height="${height}" style="border:1px solid #ddd">
      <path d="${idealPath}" stroke="#999" stroke-dasharray="4" fill="none" />
      <path d="${actualPath}" stroke="var(--accent)" stroke-width="2" fill="none" />
      <text x="${padding}" y="${padding - 10}" font-size="11">Ideal</text>
      <text x="${padding + 60}" y="${padding - 10}" fill="var(--accent)" font-size="11">Actual</text>
    </svg>
  `;
}
```

#### Step 6 — Add `#reports-view` section to HTML (`wwwroot/index.html`)

```html
<div id="reports-view" style="display:none; padding:24px">
  <div id="burndown-container"></div>
</div>
```

Hook up the "Reports" sidebar nav item to call `showReports()`.

---

---

## Story 6 — User Management (Invite & Remove Team Members)

**As an admin, I want to invite new users to the system and assign them roles so that I can control who has access to the workspace.**

### Acceptance Criteria
- Admins can create a new user with name, email, and role
- Admins can deactivate a user (they cannot log in or be assigned issues)
- The actor selector dropdown shows only active users
- Deactivated users retain their historical data (issues, audit events)
- Email must be unique in the system

### Implementation Plan

#### Step 1 — Add `IsActive` to `User` model (`Models/Domain.cs`)

```csharp
// Add to the User class:
public bool IsActive { get; set; } = true;
```

#### Step 2 — Add DTOs (`Models/Contracts.cs`)

```csharp
public record CreateUserRequest(string Name, string Email, string Role, string? AvatarUrl);

public record UserDto(string Id, string Name, string Email, string Role,
    string? AvatarUrl, bool IsActive, DateTime CreatedAt);
```

#### Step 3 — Add store methods (`Services/BuildJiraStore.cs`)

```csharp
public UserDto CreateUser(CreateUserRequest req, string actorId)
{
    RequireRole(actorId, UserRole.ADMIN);

    if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 100)
        throw new ArgumentException("Name must be 1–100 characters.");
    if (!req.Email.Contains('@'))
        throw new ArgumentException("Invalid email address.");
    if (!Enum.TryParse<UserRole>(req.Role, out var role))
        throw new ArgumentException("Invalid role.");

    lock (_lock)
    {
        bool emailTaken = _state.Users.Any(u =>
            u.Email.Equals(req.Email, StringComparison.OrdinalIgnoreCase));
        if (emailTaken) throw new InvalidOperationException("Email already in use.");

        var user = new User
        {
            Name = req.Name.Trim(),
            Email = req.Email.ToLower(),
            Role = role,
            AvatarUrl = req.AvatarUrl
        };
        _state.Users.Add(user);
        Save();
        return MapUserDto(user);
    }
}

public UserDto DeactivateUser(string userId, string actorId)
{
    RequireRole(actorId, UserRole.ADMIN);
    lock (_lock)
    {
        var user = _state.Users.FirstOrDefault(u => u.Id == userId)
            ?? throw new KeyNotFoundException("User not found.");
        if (user.Id == actorId) throw new InvalidOperationException("Cannot deactivate yourself.");
        user.IsActive = false;
        Save();
        return MapUserDto(user);
    }
}

public List<UserDto> GetUsers(bool activeOnly = false)
{
    lock (_lock)
    {
        var users = activeOnly
            ? _state.Users.Where(u => u.IsActive)
            : _state.Users;
        return users.Select(MapUserDto).ToList();
    }
}

private UserDto MapUserDto(User u) =>
    new(u.Id, u.Name, u.Email, u.Role.ToString(), u.AvatarUrl, u.IsActive, u.CreatedAt);
```

#### Step 4 — Wire endpoints (`Program.cs`)

```csharp
app.MapGet("/api/users", (BuildJiraStore store, bool? activeOnly) =>
    Results.Ok(store.GetUsers(activeOnly ?? false)));

app.MapPost("/api/users", (CreateUserRequest req, HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    return Results.Created("", store.CreateUser(req, actorId));
});

app.MapPost("/api/users/{id}/deactivate", (string id, HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    return Results.Ok(store.DeactivateUser(id, actorId));
});
```

#### Step 5 — Frontend: user management page (`wwwroot/app.js`)

Add to the sidebar nav a "Team" link. The view lists all users in a table with an "Invite" form:

```javascript
async function showTeamPage() {
  const users = await request('/api/users');
  document.getElementById('team-list').innerHTML = users.map(u => `
    <tr>
      <td><img class="avatar-sm" src="${u.avatarUrl || ''}" /> ${u.name}</td>
      <td>${u.email}</td>
      <td><span class="badge">${u.role}</span></td>
      <td>${u.isActive ? 'Active' : '<span style="color:red">Inactive</span>'}</td>
      <td>${u.isActive
        ? `<button onclick="deactivateUser('${u.id}')">Deactivate</button>`
        : ''
      }</td>
    </tr>
  `).join('');
}

async function inviteUser() {
  await request('/api/users', 'POST', {
    name: document.getElementById('invite-name').value,
    email: document.getElementById('invite-email').value,
    role: document.getElementById('invite-role').value
  });
  await showTeamPage();
}

async function deactivateUser(userId) {
  if (!confirm('Deactivate this user?')) return;
  await request(`/api/users/${userId}/deactivate`, 'POST');
  await showTeamPage();
}
```

---

---

## Story 7 — Project Creation & Settings

**As a project manager, I want to create new projects and edit project settings so that I can onboard new work without developer involvement.**

### Acceptance Criteria
- PMs and admins can create a project with a name, key (2-6 uppercase letters), and description
- Project key must be unique
- PMs and admins can update a project's name, description, lead, and health status
- The project appears in the sidebar project switcher immediately after creation
- Archiving a project hides it from the sidebar but retains its data

### Implementation Plan

#### Step 1 — Add `IsArchived` to `Project` model (`Models/Domain.cs`)

```csharp
public bool IsArchived { get; set; } = false;
```

#### Step 2 — Add DTOs (`Models/Contracts.cs`)

```csharp
public record CreateProjectRequest(
    string Name, string Key, string? Description, string? LeadId
);

public record UpdateProjectRequest(
    string? Name, string? Description, string? LeadId, string? Health
);
```

#### Step 3 — Add store methods (`Services/BuildJiraStore.cs`)

```csharp
public ProjectSummary CreateProject(CreateProjectRequest req, string actorId)
{
    RequireRole(actorId, UserRole.ADMIN, UserRole.PROJECT_MANAGER);

    var keyClean = req.Key.Trim().ToUpper();
    if (!System.Text.RegularExpressions.Regex.IsMatch(keyClean, @"^[A-Z]{2,6}$"))
        throw new ArgumentException("Key must be 2–6 uppercase letters.");

    lock (_lock)
    {
        if (_state.Projects.Any(p => p.Key == keyClean))
            throw new InvalidOperationException("Project key already exists.");

        var project = new Project
        {
            Name = req.Name.Trim(),
            Key = keyClean,
            Description = req.Description,
            LeadId = req.LeadId,
            Health = ProjectHealth.ON_TRACK
        };

        // Seed default board columns
        var defaultColumns = new[]
        {
            ("Backlog", IssueStatus.BACKLOG, 0),
            ("To Do", IssueStatus.TODO, 10),
            ("In Progress", IssueStatus.IN_PROGRESS, 3),
            ("In Review", IssueStatus.IN_REVIEW, 2),
            ("Done", IssueStatus.DONE, 0)
        };
        foreach (var (name, status, wip) in defaultColumns.Select((v, i) => (v, i)))
        {
            _state.BoardColumns.Add(new BoardColumn
            {
                Name = name.Item1, Status = name.Item2,
                Order = name.Item3, WipLimit = name.Item4 == 0 ? null : (int?)name.Item4,
                ProjectId = project.Id
            });
        }

        _state.Projects.Add(project);
        Save();
        return MapProjectSummary(project);
    }
}

public ProjectSummary UpdateProject(string key, UpdateProjectRequest req, string actorId)
{
    RequireRole(actorId, UserRole.ADMIN, UserRole.PROJECT_MANAGER);
    lock (_lock)
    {
        var project = _state.Projects.FirstOrDefault(p => p.Key == key)
            ?? throw new KeyNotFoundException("Project not found.");

        if (req.Name != null) project.Name = req.Name.Trim();
        if (req.Description != null) project.Description = req.Description;
        if (req.LeadId != null) project.LeadId = req.LeadId;
        if (req.Health != null && Enum.TryParse<ProjectHealth>(req.Health, out var health))
            project.Health = health;
        project.UpdatedAt = DateTime.UtcNow;

        Save();
        return MapProjectSummary(project);
    }
}
```

#### Step 4 — Wire endpoints (`Program.cs`)

```csharp
app.MapPost("/api/projects", (CreateProjectRequest req, HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    return Results.Created("", store.CreateProject(req, actorId));
});

app.MapPatch("/api/projects/{key}", (string key, UpdateProjectRequest req,
    HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    return Results.Ok(store.UpdateProject(key, req, actorId));
});
```

#### Step 5 — Frontend: add "New Project" button and settings panel (`wwwroot/app.js`)

```javascript
async function createProject() {
  const project = await request('/api/projects', 'POST', {
    name: document.getElementById('proj-name').value,
    key: document.getElementById('proj-key').value,
    description: document.getElementById('proj-desc').value
  });
  await boot(); // Reload the project list
  switchProject(project.key);
  document.getElementById('new-project-modal').close();
}
```

---

---

## Story 8 — Bulk Issue Operations

**As a project manager, I want to select multiple issues and update their status, assignee, or priority at once so that sprint ceremonies don't require clicking each issue individually.**

### Acceptance Criteria
- A checkbox appears on each issue card when "bulk mode" is active
- The user can select 2 or more issues
- A floating action bar appears with: "Move to status", "Assign to", "Set priority", "Delete"
- Actions apply to all selected issues in one API call
- An audit event is created per issue (not one event for the batch)
- The board re-renders with updated cards after each bulk action

### Implementation Plan

#### Step 1 — Add `BulkUpdateRequest` DTO (`Models/Contracts.cs`)

```csharp
public record BulkUpdateRequest(
    List<string> IssueIds,
    string? Status,
    string? AssigneeId,
    string? Priority
);

public record BulkUpdateResponse(int UpdatedCount, List<IssueDto> UpdatedIssues);
```

#### Step 2 — Add store method (`Services/BuildJiraStore.cs`)

```csharp
public BulkUpdateResponse BulkUpdateIssues(BulkUpdateRequest req, string actorId)
{
    RequireRole(actorId, UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER);

    if (req.IssueIds.Count == 0)
        throw new ArgumentException("No issues selected.");
    if (req.IssueIds.Count > 50)
        throw new ArgumentException("Cannot bulk-update more than 50 issues at once.");

    lock (_lock)
    {
        var updated = new List<IssueDto>();
        foreach (var id in req.IssueIds)
        {
            var issue = _state.Issues.FirstOrDefault(i => i.Id == id);
            if (issue == null) continue;

            if (req.Status != null && Enum.TryParse<IssueStatus>(req.Status, out var status))
                issue.Status = status;
            if (req.AssigneeId != null)
                issue.AssigneeId = req.AssigneeId == "none" ? null : req.AssigneeId;
            if (req.Priority != null && Enum.TryParse<IssuePriority>(req.Priority, out var priority))
                issue.Priority = priority;

            issue.UpdatedAt = DateTime.UtcNow;

            _state.AuditEvents.Add(new AuditEvent
            {
                ActorId = actorId, Action = "BULK_UPDATED",
                Entity = "Issue", EntityId = id
            });

            updated.Add(MapIssueDto(issue));
        }
        Save();
        return new BulkUpdateResponse(updated.Count, updated);
    }
}
```

#### Step 3 — Wire endpoint (`Program.cs`)

```csharp
app.MapPost("/api/issues/bulk", (BulkUpdateRequest req, HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    return Results.Ok(store.BulkUpdateIssues(req, actorId));
});
```

#### Step 4 — Frontend: bulk selection mode (`wwwroot/app.js`)

```javascript
let bulkSelectedIds = new Set();
let bulkModeActive = false;

function toggleBulkMode() {
  bulkModeActive = !bulkModeActive;
  bulkSelectedIds.clear();
  render(); // Re-render board to show/hide checkboxes
  document.getElementById('bulk-bar').style.display = bulkModeActive ? 'flex' : 'none';
}

function toggleIssueSelect(issueId) {
  if (bulkSelectedIds.has(issueId)) {
    bulkSelectedIds.delete(issueId);
  } else {
    bulkSelectedIds.add(issueId);
  }
  document.getElementById(`check-${issueId}`).checked = bulkSelectedIds.has(issueId);
  document.getElementById('bulk-count').textContent = `${bulkSelectedIds.size} selected`;
}

async function applyBulkAction(field) {
  if (bulkSelectedIds.size === 0) { alert('Select at least one issue.'); return; }
  const value = document.getElementById(`bulk-${field}`).value;
  if (!value) return;
  await request('/api/issues/bulk', 'POST', {
    issueIds: [...bulkSelectedIds],
    [field]: value
  });
  bulkSelectedIds.clear();
  await loadBoard();
}
```

#### Step 5 — HTML: add the bulk action bar (`wwwroot/index.html`)

```html
<div id="bulk-bar" style="display:none" class="bulk-action-bar">
  <span id="bulk-count">0 selected</span>
  <select id="bulk-status"><option value="">Move to status…</option>
    <option value="TODO">To Do</option>
    <option value="IN_PROGRESS">In Progress</option>
    <option value="DONE">Done</option>
  </select>
  <button onclick="applyBulkAction('status')">Apply</button>
  <button onclick="toggleBulkMode()">Cancel</button>
</div>
<button id="btn-bulk" onclick="toggleBulkMode()">Bulk Edit</button>
```

---

---

## Story 9 — Saved Filters & Search

**As an engineer, I want to save my frequently used issue filters so that I can quickly return to views I use every day without rebuilding them.**

### Acceptance Criteria
- The user can filter issues by: status, assignee, priority, type, and label (free text search)
- Filters can be given a name and saved to the user's profile
- Saved filters appear in a "My Filters" dropdown in the top bar
- Applying a saved filter updates the board view instantly
- Filters are stored per-user in the app state

### Implementation Plan

#### Step 1 — Add `SavedFilter` model (`Models/Domain.cs`)

```csharp
public class SavedFilter
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = "";
    public string Name { get; set; } = "";
    public string? StatusFilter { get; set; }
    public string? AssigneeId { get; set; }
    public string? PriorityFilter { get; set; }
    public string? TypeFilter { get; set; }
    public string? TextSearch { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

Add to `BuildJiraState`:

```csharp
public List<SavedFilter> SavedFilters { get; set; } = new();
```

#### Step 2 — Add DTOs (`Models/Contracts.cs`)

```csharp
public record SaveFilterRequest(
    string Name,
    string? StatusFilter,
    string? AssigneeId,
    string? PriorityFilter,
    string? TypeFilter,
    string? TextSearch
);

public record SavedFilterDto(
    string Id, string UserId, string Name,
    string? StatusFilter, string? AssigneeId,
    string? PriorityFilter, string? TypeFilter, string? TextSearch
);
```

#### Step 3 — Add store methods (`Services/BuildJiraStore.cs`)

```csharp
public SavedFilterDto SaveFilter(SaveFilterRequest req, string actorId)
{
    if (string.IsNullOrWhiteSpace(req.Name))
        throw new ArgumentException("Filter name is required.");

    lock (_lock)
    {
        var filter = new SavedFilter
        {
            UserId = actorId,
            Name = req.Name.Trim(),
            StatusFilter = req.StatusFilter,
            AssigneeId = req.AssigneeId,
            PriorityFilter = req.PriorityFilter,
            TypeFilter = req.TypeFilter,
            TextSearch = req.TextSearch
        };
        _state.SavedFilters.Add(filter);
        Save();
        return MapFilterDto(filter);
    }
}

public List<SavedFilterDto> GetFiltersForUser(string userId)
{
    lock (_lock)
    {
        return _state.SavedFilters
            .Where(f => f.UserId == userId)
            .Select(MapFilterDto)
            .ToList();
    }
}

public void DeleteFilter(string filterId, string actorId)
{
    lock (_lock)
    {
        var filter = _state.SavedFilters.FirstOrDefault(f => f.Id == filterId)
            ?? throw new KeyNotFoundException("Filter not found.");
        if (filter.UserId != actorId)
            throw new UnauthorizedAccessException("Cannot delete another user's filter.");
        _state.SavedFilters.Remove(filter);
        Save();
    }
}
```

#### Step 4 — Wire endpoints (`Program.cs`)

```csharp
app.MapGet("/api/filters", (HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    return Results.Ok(store.GetFiltersForUser(actorId));
});

app.MapPost("/api/filters", (SaveFilterRequest req, HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    return Results.Created("", store.SaveFilter(req, actorId));
});

app.MapDelete("/api/filters/{id}", (string id, HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    store.DeleteFilter(id, actorId);
    return Results.NoContent();
});
```

#### Step 5 — Frontend: filter UI (`wwwroot/app.js`)

```javascript
let activeFilters = {};

function applyFilter(filter) {
  activeFilters = {
    status: filter.statusFilter,
    assigneeId: filter.assigneeId,
    priority: filter.priorityFilter,
    type: filter.typeFilter,
    text: filter.textSearch
  };
  renderBoard();
}

function filterIssues(issues) {
  return issues.filter(issue => {
    if (activeFilters.status && issue.status !== activeFilters.status) return false;
    if (activeFilters.assigneeId && issue.assigneeId !== activeFilters.assigneeId) return false;
    if (activeFilters.priority && issue.priority !== activeFilters.priority) return false;
    if (activeFilters.type && issue.type !== activeFilters.type) return false;
    if (activeFilters.text) {
      const q = activeFilters.text.toLowerCase();
      if (!issue.title.toLowerCase().includes(q) && !issue.key.toLowerCase().includes(q))
        return false;
    }
    return true;
  });
}

async function loadSavedFilters() {
  const filters = await request('/api/filters');
  const dropdown = document.getElementById('saved-filters-list');
  dropdown.innerHTML = filters.map(f =>
    `<li><a href="#" onclick="applyFilter(${JSON.stringify(f)})">${f.name}</a>
     <button onclick="deleteFilter('${f.id}')">×</button></li>`
  ).join('');
}

async function saveCurrentFilter() {
  const name = prompt('Filter name:');
  if (!name) return;
  await request('/api/filters', 'POST', { name, ...activeFilters });
  await loadSavedFilters();
}
```

---

---

## Story 10 — CSV Export

**As a project manager, I want to export issues to a CSV file so that I can analyze data in spreadsheet tools and share reports with stakeholders.**

### Acceptance Criteria
- A "Export CSV" button on the board triggers a download
- The CSV includes: Key, Title, Status, Type, Priority, Story Points, Assignee, Reporter, Sprint, Created At, Updated At
- Export is scoped to the currently viewed project
- Optionally export only filtered issues (if a filter is active)
- The file is named `{PROJECT-KEY}-issues-{DATE}.csv`

### Implementation Plan

#### Step 1 — Add the CSV endpoint to `Program.cs`

No new domain model is needed. Just a new endpoint that reads existing data:

```csharp
app.MapGet("/api/projects/{key}/export/csv", (string key, BuildJiraStore store) =>
{
    var csvBytes = store.ExportIssuesCsv(key);
    var fileName = $"{key}-issues-{DateTime.UtcNow:yyyy-MM-dd}.csv";
    return Results.File(csvBytes, "text/csv", fileName);
});
```

#### Step 2 — Add store method (`Services/BuildJiraStore.cs`)

```csharp
public byte[] ExportIssuesCsv(string projectKey)
{
    lock (_lock)
    {
        var project = _state.Projects.FirstOrDefault(p => p.Key == projectKey)
            ?? throw new KeyNotFoundException("Project not found.");

        var issues = _state.Issues.Where(i => i.ProjectId == project.Id).ToList();

        var sb = new System.Text.StringBuilder();
        // Header row
        sb.AppendLine("Key,Title,Status,Type,Priority,StoryPoints,Assignee,Reporter,Sprint,CreatedAt,UpdatedAt");

        foreach (var issue in issues)
        {
            var assignee = _state.Users.FirstOrDefault(u => u.Id == issue.AssigneeId)?.Name ?? "";
            var reporter = _state.Users.FirstOrDefault(u => u.Id == issue.ReporterId)?.Name ?? "";
            var sprint = _state.Sprints.FirstOrDefault(s => s.Id == issue.SprintId)?.Name ?? "";

            // Escape fields that may contain commas or quotes
            sb.AppendLine(string.Join(",",
                CsvEscape(issue.Key),
                CsvEscape(issue.Title),
                issue.Status,
                issue.Type,
                issue.Priority,
                issue.StoryPoints?.ToString() ?? "",
                CsvEscape(assignee),
                CsvEscape(reporter),
                CsvEscape(sprint),
                issue.CreatedAt.ToString("o"),
                issue.UpdatedAt?.ToString("o") ?? ""
            ));
        }

        return System.Text.Encoding.UTF8.GetBytes(sb.ToString());
    }
}

private static string CsvEscape(string value)
{
    if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
        return $"\"{value.Replace("\"", "\"\"")}\"";
    return value;
}
```

#### Step 3 — Frontend: trigger download (`wwwroot/app.js`)

```javascript
function exportCsv() {
  // Create a temporary anchor tag to trigger a browser download
  const a = document.createElement('a');
  a.href = `/api/projects/${currentProjectKey}/export/csv`;
  a.download = '';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
```

#### Step 4 — Add the export button to the board toolbar (`wwwroot/index.html`)

```html
<button onclick="exportCsv()" title="Export issues to CSV">Export CSV</button>
```

No CSS changes needed — reuse existing toolbar button styles.

---

---

## Story 11 — Audit Log Dashboard (Governance Page)

**As an admin, I want a full audit log dashboard so that I can review who made what changes and when for compliance and accountability purposes.**

### Acceptance Criteria
- A "Governance" page is accessible from the sidebar (currently a stub)
- Events are paginated, 25 per page, newest first
- Columns: Timestamp, Actor Name, Action, Entity Type, Entity ID, Details
- Filters: by actor, by action type, by date range
- Only admins and project managers can view this page
- Clicking an entity ID navigates to that issue (if the entity is an issue)

### Implementation Plan

#### Step 1 — Extend `GetAuditEvents` in the store to support filtering and pagination (`Services/BuildJiraStore.cs`)

Replace the existing `GetAuditEvents()` with:

```csharp
public record AuditQueryParams(
    string? ActorId = null,
    string? Action = null,
    DateTime? From = null,
    DateTime? To = null,
    int Page = 1,
    int PageSize = 25
);

public record PagedAuditResponse(
    List<AuditEventDto> Events,
    int TotalCount,
    int Page,
    int PageSize
);

public PagedAuditResponse GetAuditEvents(string actorId, AuditQueryParams query)
{
    RequireRole(actorId, UserRole.ADMIN, UserRole.PROJECT_MANAGER);

    lock (_lock)
    {
        var events = _state.AuditEvents.AsEnumerable();

        if (query.ActorId != null)
            events = events.Where(e => e.ActorId == query.ActorId);
        if (query.Action != null)
            events = events.Where(e => e.Action == query.Action);
        if (query.From != null)
            events = events.Where(e => e.CreatedAt >= query.From);
        if (query.To != null)
            events = events.Where(e => e.CreatedAt <= query.To);

        var total = events.Count();
        var paged = events
            .OrderByDescending(e => e.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(e =>
            {
                var actor = _state.Users.FirstOrDefault(u => u.Id == e.ActorId);
                return new AuditEventDto(e.Id, e.ActorId, actor?.Name ?? "Unknown",
                    e.Action, e.Entity, e.EntityId, e.Metadata, e.CreatedAt);
            })
            .ToList();

        return new PagedAuditResponse(paged, total, query.Page, query.PageSize);
    }
}
```

#### Step 2 — Update `AuditEventDto` to include actor name (`Models/Contracts.cs`)

```csharp
// Add ActorName to AuditEventDto:
public record AuditEventDto(
    string Id, string ActorId, string ActorName,
    string Action, string Entity, string EntityId,
    string? Metadata, DateTime CreatedAt
);
```

#### Step 3 — Update endpoint (`Program.cs`)

```csharp
app.MapGet("/api/audit", (HttpRequest http, BuildJiraStore store,
    string? actorFilter, string? action, string? from, string? to, int? page, int? pageSize) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    var query = new AuditQueryParams(
        ActorId: actorFilter,
        Action: action,
        From: from != null ? DateTime.Parse(from) : null,
        To: to != null ? DateTime.Parse(to) : null,
        Page: page ?? 1,
        PageSize: pageSize ?? 25
    );
    return Results.Ok(store.GetAuditEvents(actorId, query));
});
```

#### Step 4 — Frontend: governance view (`wwwroot/app.js`)

```javascript
let auditPage = 1;

async function showGovernance() {
  document.getElementById('board-view').style.display = 'none';
  document.getElementById('governance-view').style.display = 'block';
  await loadAuditPage(1);
}

async function loadAuditPage(page) {
  auditPage = page;
  const actorFilter = document.getElementById('audit-actor-filter')?.value || '';
  const actionFilter = document.getElementById('audit-action-filter')?.value || '';
  const params = new URLSearchParams({ page, pageSize: 25 });
  if (actorFilter) params.set('actorFilter', actorFilter);
  if (actionFilter) params.set('action', actionFilter);

  const data = await request(`/api/audit?${params}`);
  const totalPages = Math.ceil(data.totalCount / data.pageSize);

  document.getElementById('audit-table-body').innerHTML = data.events.map(e => `
    <tr>
      <td>${new Date(e.createdAt).toLocaleString()}</td>
      <td>${e.actorName}</td>
      <td><code>${e.action}</code></td>
      <td>${e.entity}</td>
      <td>${e.entity === 'Issue'
        ? `<a href="#" onclick="selectIssueById('${e.entityId}')">${e.entityId.slice(0,8)}…</a>`
        : e.entityId.slice(0,8) + '…'}</td>
      <td>${e.metadata ? JSON.stringify(JSON.parse(e.metadata)) : ''}</td>
    </tr>
  `).join('');

  document.getElementById('audit-pagination').innerHTML =
    `Page ${auditPage} of ${totalPages}
     <button onclick="loadAuditPage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>Prev</button>
     <button onclick="loadAuditPage(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>Next</button>`;
}
```

#### Step 5 — HTML: governance view (`wwwroot/index.html`)

```html
<div id="governance-view" style="display:none; padding:24px">
  <h2>Audit Log</h2>
  <div class="filter-bar">
    <select id="audit-actor-filter" onchange="loadAuditPage(1)">
      <option value="">All actors</option>
    </select>
    <input id="audit-action-filter" placeholder="Filter by action…" oninput="loadAuditPage(1)" />
  </div>
  <table class="audit-table">
    <thead>
      <tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>ID</th><th>Details</th></tr>
    </thead>
    <tbody id="audit-table-body"></tbody>
  </table>
  <div id="audit-pagination"></div>
</div>
```

---

---

## Story 12 — Board Swimlanes

**As a project manager, I want to group board issues into swimlanes (by assignee, priority, or epic) so that I can visually separate work by category at a glance.**

### Acceptance Criteria
- A "Group by" dropdown on the board toolbar lets users select: None, Assignee, Priority, Type
- When a grouping is active, horizontal swimlane rows appear above each set of columns
- Issues only appear in their matching swimlane row
- "None" restores the flat single-row board layout
- Swimlane preference is stored in `localStorage` and restored on reload

### Implementation Plan

#### Step 1 — No backend changes needed

Swimlanes are a pure frontend rendering feature. All the data is already in the board response.

#### Step 2 — Add a group-by dropdown to the toolbar (`wwwroot/index.html`)

```html
<label>Group by:
  <select id="group-by" onchange="setGroupBy(this.value)">
    <option value="none">None</option>
    <option value="assignee">Assignee</option>
    <option value="priority">Priority</option>
    <option value="type">Type</option>
  </select>
</label>
```

#### Step 3 — Implement swimlane rendering (`wwwroot/app.js`)

```javascript
let groupBy = localStorage.getItem('groupBy') || 'none';

function setGroupBy(value) {
  groupBy = value;
  localStorage.setItem('groupBy', value);
  document.getElementById('group-by').value = value;
  renderBoard();
}

function getGroupKeys(issues) {
  if (groupBy === 'none') return [null];
  const seen = new Set();
  const keys = [];
  for (const issue of issues) {
    const key = groupBy === 'assignee' ? (issue.assigneeId || '__unassigned')
               : groupBy === 'priority' ? issue.priority
               : issue.type;
    if (!seen.has(key)) { seen.add(key); keys.push(key); }
  }
  return keys.sort();
}

function getLaneLabel(key) {
  if (key === null) return '';
  if (groupBy === 'assignee') {
    const user = currentTeam?.find(u => u.id === key);
    return user ? user.name : 'Unassigned';
  }
  return key;
}

function renderBoard() {
  const issues = filterIssues(currentIssues);
  const columns = currentColumns;
  const laneKeys = getGroupKeys(issues);
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';

  for (const laneKey of laneKeys) {
    const laneIssues = laneKey === null
      ? issues
      : issues.filter(i => {
          const k = groupBy === 'assignee' ? (i.assigneeId || '__unassigned')
                  : groupBy === 'priority' ? i.priority
                  : i.type;
          return k === laneKey;
        });

    if (laneKey !== null) {
      const laneHeader = document.createElement('div');
      laneHeader.className = 'swimlane-header';
      laneHeader.textContent = getLaneLabel(laneKey);
      boardEl.appendChild(laneHeader);
    }

    const row = document.createElement('div');
    row.className = 'board-row';
    for (const col of columns) {
      const colIssues = laneIssues.filter(i => i.status === col.status);
      row.appendChild(renderColumn(col, colIssues));
    }
    boardEl.appendChild(row);
  }
}
```

#### Step 4 — Add swimlane CSS (`wwwroot/styles.css`)

```css
.swimlane-header {
  grid-column: 1 / -1;
  background: var(--bg-secondary);
  padding: 6px 12px;
  font-weight: 600;
  font-size: 13px;
  border-left: 3px solid var(--accent);
  margin: 8px 0 2px;
}

.board-row {
  display: contents; /* participates in the parent CSS grid */
}
```

---

---

## Story 13 — Issue Templates

**As a project manager, I want to create issue templates for common work types so that engineers can create well-formed issues quickly without forgetting required fields.**

### Acceptance Criteria
- Admins and PMs can create a template with: name, default type, priority, story points, and a description template with placeholder text
- When creating a new issue, users can select "From Template" to pre-populate fields
- Templates are scoped to a project
- Templates can be edited and deleted
- A template can be designated as the default for a given issue type

### Implementation Plan

#### Step 1 — Add `IssueTemplate` model (`Models/Domain.cs`)

```csharp
public class IssueTemplate
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ProjectId { get; set; } = "";
    public string Name { get; set; } = "";
    public IssueType DefaultType { get; set; }
    public IssuePriority DefaultPriority { get; set; } = IssuePriority.MEDIUM;
    public int? DefaultStoryPoints { get; set; }
    public string? DescriptionTemplate { get; set; }
    public bool IsDefault { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

Add to `BuildJiraState`:

```csharp
public List<IssueTemplate> IssueTemplates { get; set; } = new();
```

#### Step 2 — Add DTOs (`Models/Contracts.cs`)

```csharp
public record CreateTemplateRequest(
    string ProjectId, string Name, string DefaultType, string DefaultPriority,
    int? DefaultStoryPoints, string? DescriptionTemplate, bool IsDefault
);

public record IssueTemplateDto(
    string Id, string ProjectId, string Name, string DefaultType,
    string DefaultPriority, int? DefaultStoryPoints, string? DescriptionTemplate, bool IsDefault
);
```

#### Step 3 — Add store methods (`Services/BuildJiraStore.cs`)

```csharp
public IssueTemplateDto CreateTemplate(CreateTemplateRequest req, string actorId)
{
    RequireRole(actorId, UserRole.ADMIN, UserRole.PROJECT_MANAGER);

    if (!Enum.TryParse<IssueType>(req.DefaultType, out var type))
        throw new ArgumentException("Invalid issue type.");
    if (!Enum.TryParse<IssuePriority>(req.DefaultPriority, out var priority))
        throw new ArgumentException("Invalid priority.");

    lock (_lock)
    {
        if (req.IsDefault)
        {
            // Clear existing default for this type/project combo
            foreach (var t in _state.IssueTemplates
                .Where(t => t.ProjectId == req.ProjectId && t.DefaultType == type))
                t.IsDefault = false;
        }

        var template = new IssueTemplate
        {
            ProjectId = req.ProjectId,
            Name = req.Name.Trim(),
            DefaultType = type,
            DefaultPriority = priority,
            DefaultStoryPoints = req.DefaultStoryPoints,
            DescriptionTemplate = req.DescriptionTemplate,
            IsDefault = req.IsDefault
        };
        _state.IssueTemplates.Add(template);
        Save();
        return MapTemplateDto(template);
    }
}

public List<IssueTemplateDto> GetTemplates(string projectId)
{
    lock (_lock)
    {
        return _state.IssueTemplates
            .Where(t => t.ProjectId == projectId)
            .Select(MapTemplateDto)
            .ToList();
    }
}
```

#### Step 4 — Wire endpoints (`Program.cs`)

```csharp
app.MapGet("/api/projects/{key}/templates", (string key, BuildJiraStore store) =>
{
    var project = store.GetProjectByKey(key);
    return Results.Ok(store.GetTemplates(project.Id));
});

app.MapPost("/api/templates", (CreateTemplateRequest req, HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    return Results.Created("", store.CreateTemplate(req, actorId));
});

app.MapDelete("/api/templates/{id}", (string id, HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    store.DeleteTemplate(id, actorId);
    return Results.NoContent();
});
```

#### Step 5 — Frontend: template picker in the new issue modal (`wwwroot/app.js`)

```javascript
let currentTemplates = [];

async function loadTemplates() {
  currentTemplates = await request(`/api/projects/${currentProjectKey}/templates`);
  const sel = document.getElementById('template-select');
  sel.innerHTML = '<option value="">No template</option>' +
    currentTemplates.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
}

function applyTemplate(templateId) {
  const template = currentTemplates.find(t => t.id === templateId);
  if (!template) return;
  document.getElementById('new-issue-type').value = template.defaultType;
  document.getElementById('new-issue-priority').value = template.defaultPriority;
  document.getElementById('new-issue-points').value = template.defaultStoryPoints ?? '';
  document.getElementById('new-issue-desc').value = template.descriptionTemplate ?? '';
}
```

---

---

## Story 14 — Webhook Notifications

**As a developer, I want to configure webhooks so that my team's external tools (Slack, CI systems) are automatically notified when issues change.**

### Acceptance Criteria
- Admins can register a webhook URL with a list of events to subscribe to
- Events: `issue.created`, `issue.updated`, `issue.status_changed`, `sprint.started`, `sprint.closed`
- When a subscribed event fires, the server POSTs a JSON payload to the webhook URL
- The webhook delivery includes: event type, timestamp, affected entity, actor
- Webhook deliveries are logged with status (success/failure) for debugging
- Admins can test a webhook by sending a ping payload

### Implementation Plan

#### Step 1 — Add `Webhook` and `WebhookDelivery` models (`Models/Domain.cs`)

```csharp
public class Webhook
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Url { get; set; } = "";
    public List<string> Events { get; set; } = new();
    public string Secret { get; set; } = Guid.NewGuid().ToString("N");
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class WebhookDelivery
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string WebhookId { get; set; } = "";
    public string Event { get; set; } = "";
    public string Payload { get; set; } = "";
    public int? ResponseStatus { get; set; }
    public bool Success { get; set; }
    public DateTime DeliveredAt { get; set; } = DateTime.UtcNow;
}
```

Add to `BuildJiraState`:

```csharp
public List<Webhook> Webhooks { get; set; } = new();
public List<WebhookDelivery> WebhookDeliveries { get; set; } = new();
```

#### Step 2 — Create `WebhookDispatcher` service (`Services/WebhookDispatcher.cs`)

```csharp
public class WebhookDispatcher
{
    private readonly BuildJiraStore _store;
    private readonly IHttpClientFactory _httpClientFactory;

    public WebhookDispatcher(BuildJiraStore store, IHttpClientFactory factory)
    {
        _store = store;
        _httpClientFactory = factory;
    }

    public async Task DispatchAsync(string eventName, object payload)
    {
        var webhooks = _store.GetWebhooksForEvent(eventName);
        foreach (var webhook in webhooks)
        {
            var json = System.Text.Json.JsonSerializer.Serialize(new
            {
                @event = eventName,
                timestamp = DateTime.UtcNow,
                data = payload
            });

            bool success = false;
            int? statusCode = null;

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(10);
                var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
                // Sign the payload with HMAC-SHA256 using the webhook secret
                var signature = ComputeHmac(webhook.Secret, json);
                content.Headers.Add("X-BuildJira-Signature", signature);

                var response = await client.PostAsync(webhook.Url, content);
                statusCode = (int)response.StatusCode;
                success = response.IsSuccessStatusCode;
            }
            catch { /* Network error — success remains false */ }

            _store.RecordDelivery(webhook.Id, eventName, json, statusCode, success);
        }
    }

    private static string ComputeHmac(string secret, string payload)
    {
        var key = System.Text.Encoding.UTF8.GetBytes(secret);
        var data = System.Text.Encoding.UTF8.GetBytes(payload);
        using var hmac = new System.Security.Cryptography.HMACSHA256(key);
        return Convert.ToHexString(hmac.ComputeHash(data)).ToLower();
    }
}
```

#### Step 3 — Register services and dispatch from the store (`Program.cs` and `BuildJiraStore.cs`)

In `Program.cs`:

```csharp
builder.Services.AddHttpClient();
builder.Services.AddScoped<WebhookDispatcher>();
```

In `BuildJiraStore.UpdateIssue()`, after saving, call the dispatcher (inject via constructor):

```csharp
// At the end of UpdateIssue, after Save():
_ = _dispatcher.DispatchAsync("issue.updated", new { issueId = id, changes = patch });
```

#### Step 4 — Wire CRUD endpoints for webhooks (`Program.cs`)

```csharp
app.MapGet("/api/webhooks", (HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    return Results.Ok(store.GetWebhooks(actorId));
});

app.MapPost("/api/webhooks", (CreateWebhookRequest req, HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    return Results.Created("", store.CreateWebhook(req, actorId));
});

app.MapPost("/api/webhooks/{id}/ping", async (string id, HttpRequest http,
    BuildJiraStore store, WebhookDispatcher dispatcher) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    store.RequireRole(actorId, UserRole.ADMIN);
    await dispatcher.DispatchAsync("ping", new { message = "BuildJira webhook test" });
    return Results.Ok(new { sent = true });
});
```

#### Step 5 — Frontend: Webhook management page (`wwwroot/app.js`)

```javascript
async function loadWebhooks() {
  const webhooks = await request('/api/webhooks');
  document.getElementById('webhook-list').innerHTML = webhooks.map(w => `
    <tr>
      <td>${w.url}</td>
      <td>${w.events.join(', ')}</td>
      <td>${w.isActive ? 'Active' : 'Paused'}</td>
      <td><button onclick="pingWebhook('${w.id}')">Ping</button></td>
    </tr>
  `).join('');
}

async function pingWebhook(id) {
  const result = await request(`/api/webhooks/${id}/ping`, 'POST');
  alert(result.sent ? 'Ping sent!' : 'Failed to send ping.');
}
```

---

---

## Story 15 — Issue Labels / Tags

**As an engineer, I want to add freeform labels to issues so that I can tag related work across projects (e.g., "technical-debt", "accessibility", "performance").**

### Acceptance Criteria
- Labels are freeform strings, max 30 characters each, no spaces (use hyphens)
- An issue can have 0–10 labels
- Labels appear as colored chips on issue cards
- Users can filter the board by one or more labels
- Frequently used labels auto-complete in the label input field
- Labels are stored on the issue in the data model

### Implementation Plan

#### Step 1 — Add `Labels` to `Issue` model (`Models/Domain.cs`)

```csharp
// In the Issue class, add:
public List<string> Labels { get; set; } = new();
```

#### Step 2 — Include labels in `UpdateIssueRequest` (`Models/Contracts.cs`)

```csharp
// In the existing UpdateIssueRequest, add:
List<string>? Labels
```

Include in `IssueDto`:

```csharp
// In the existing IssueDto, add:
List<string> Labels
```

#### Step 3 — Update the store's `UpdateIssue` method (`Services/BuildJiraStore.cs`)

In the existing `UpdateIssue` method, add handling for the labels field:

```csharp
if (req.Labels != null)
{
    if (req.Labels.Count > 10)
        throw new ArgumentException("Maximum 10 labels per issue.");
    foreach (var label in req.Labels)
    {
        if (label.Length > 30 || label.Contains(' '))
            throw new ArgumentException($"Label '{label}' is invalid. Max 30 chars, no spaces.");
    }
    issue.Labels = req.Labels.Select(l => l.ToLower()).ToList();
}
```

Add a label-suggestions endpoint:

```csharp
public List<string> GetLabelSuggestions(string projectKey, string prefix)
{
    lock (_lock)
    {
        var project = _state.Projects.FirstOrDefault(p => p.Key == projectKey);
        return _state.Issues
            .Where(i => i.ProjectId == project?.Id)
            .SelectMany(i => i.Labels)
            .Where(l => l.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            .Distinct()
            .OrderBy(l => l)
            .Take(10)
            .ToList();
    }
}
```

#### Step 4 — Wire autocomplete endpoint (`Program.cs`)

```csharp
app.MapGet("/api/projects/{key}/labels", (string key, string? prefix, BuildJiraStore store) =>
    Results.Ok(store.GetLabelSuggestions(key, prefix ?? "")));
```

#### Step 5 — Frontend: label chips on cards (`wwwroot/app.js`)

In `renderBoard()`, within the issue card template:

```javascript
${issue.labels?.length > 0
  ? `<div class="label-chips">${issue.labels.map(l =>
      `<span class="label-chip" style="background:${labelColor(l)}">${l}</span>`
    ).join('')}</div>`
  : ''}
```

In the issue panel, add an inline label editor:

```javascript
async function addLabel(issueId, label) {
  const clean = label.trim().toLowerCase().replace(/\s+/g, '-');
  if (!clean) return;
  const current = currentIssue.labels || [];
  if (current.includes(clean)) return;
  await saveIssue(issueId, { labels: [...current, clean] });
}

function labelColor(label) {
  // Deterministic color from label string hash
  let hash = 0;
  for (const c of label) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return `hsl(${Math.abs(hash) % 360}, 55%, 75%)`;
}

async function loadLabelSuggestions(prefix) {
  if (prefix.length < 2) return;
  const suggestions = await request(`/api/projects/${currentProjectKey}/labels?prefix=${prefix}`);
  // Render suggestions as a datalist
  const list = document.getElementById('label-suggestions');
  list.innerHTML = suggestions.map(s => `<option value="${s}">`).join('');
}
```

#### Step 6 — Add label CSS (`wwwroot/styles.css`)

```css
.label-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.label-chip { font-size: 11px; padding: 2px 6px; border-radius: 10px; color: #333; }
```

---

---

## Story 16 — Activity Feed / Notifications

**As a team member, I want a personal activity feed so that I can see all recent changes to issues I'm involved with without manually checking each one.**

### Acceptance Criteria
- A bell icon in the top bar shows an unread count badge
- Clicking it opens a feed of events on issues where the user is assignee or reporter
- Each feed item shows: action, issue key, actor name, and relative time
- Feed items are dismissed/marked-read by clicking them
- The feed polls for updates every 30 seconds
- Only shows events from the last 7 days

### Implementation Plan

#### Step 1 — Add `read_by` tracking to `AuditEvent` (`Models/Domain.cs`)

```csharp
// Add to AuditEvent:
public List<string> ReadByUserIds { get; set; } = new();
```

#### Step 2 — Add store method for personal feed (`Services/BuildJiraStore.cs`)

```csharp
public List<AuditEventDto> GetActivityFeed(string userId)
{
    lock (_lock)
    {
        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);

        // Get issue IDs where user is involved
        var involvedIssueIds = _state.Issues
            .Where(i => i.AssigneeId == userId || i.ReporterId == userId)
            .Select(i => i.Id)
            .ToHashSet();

        return _state.AuditEvents
            .Where(e => e.Entity == "Issue"
                && involvedIssueIds.Contains(e.EntityId)
                && e.CreatedAt >= sevenDaysAgo
                && e.ActorId != userId) // exclude own actions
            .OrderByDescending(e => e.CreatedAt)
            .Take(50)
            .Select(e =>
            {
                var actor = _state.Users.FirstOrDefault(u => u.Id == e.ActorId);
                return new AuditEventDto(e.Id, e.ActorId, actor?.Name ?? "Unknown",
                    e.Action, e.Entity, e.EntityId, e.Metadata, e.CreatedAt)
                {
                    IsRead = e.ReadByUserIds.Contains(userId)
                };
            })
            .ToList();
    }
}

public void MarkEventRead(string eventId, string userId)
{
    lock (_lock)
    {
        var ev = _state.AuditEvents.FirstOrDefault(e => e.Id == eventId);
        if (ev == null) return;
        if (!ev.ReadByUserIds.Contains(userId))
            ev.ReadByUserIds.Add(userId);
        Save();
    }
}
```

Note: Update `AuditEventDto` to include `bool IsRead`.

#### Step 3 — Wire endpoints (`Program.cs`)

```csharp
app.MapGet("/api/activity", (HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    return Results.Ok(store.GetActivityFeed(actorId));
});

app.MapPost("/api/activity/{id}/read", (string id, HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    store.MarkEventRead(id, actorId);
    return Results.NoContent();
});
```

#### Step 4 — Frontend: notification bell (`wwwroot/app.js`)

```javascript
let activityPollInterval = null;

async function loadActivityFeed() {
  const events = await request('/api/activity');
  const unread = events.filter(e => !e.isRead).length;

  document.getElementById('notif-badge').textContent = unread > 0 ? unread : '';
  document.getElementById('notif-badge').style.display = unread > 0 ? 'block' : 'none';

  document.getElementById('activity-feed').innerHTML = events.map(e => `
    <div class="feed-item ${e.isRead ? 'read' : 'unread'}" onclick="markRead('${e.id}')">
      <strong>${e.actorName}</strong> ${humanizeAction(e.action)} on
      <a href="#">${e.entityId.slice(0,8)}…</a>
      <span class="feed-time">${timeAgo(e.createdAt)}</span>
    </div>
  `).join('') || '<p class="muted">No recent activity.</p>';
}

async function markRead(eventId) {
  await request(`/api/activity/${eventId}/read`, 'POST');
  loadActivityFeed();
}

function startActivityPolling() {
  loadActivityFeed();
  activityPollInterval = setInterval(loadActivityFeed, 30000);
}

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function humanizeAction(action) {
  const map = { 'ISSUE_UPDATED': 'updated', 'COMMENT_ADDED': 'commented',
    'ISSUE_CREATED': 'created an issue' };
  return map[action] || action.toLowerCase().replace('_', ' ');
}
```

#### Step 5 — HTML: bell icon and feed panel (`wwwroot/index.html`)

```html
<div class="notif-container">
  <button id="btn-notif" onclick="toggleFeedPanel()">🔔
    <span id="notif-badge" class="badge badge-red" style="display:none">0</span>
  </button>
  <div id="activity-feed-panel" class="feed-panel" style="display:none">
    <div id="activity-feed"></div>
  </div>
</div>
```

---

---

## Story 17 — WIP Limit Configuration UI

**As a project manager, I want to configure WIP limits for each board column directly from the UI so that I don't need to edit data files to tune the team's flow.**

### Acceptance Criteria
- Each column header shows a settings gear icon visible on hover
- Clicking it opens an inline editor for the column name and WIP limit
- Setting WIP to 0 or blank disables the limit for that column
- Changes take effect immediately on the board
- Only PMs and admins can edit column settings

### Implementation Plan

#### Step 1 — Add store method to update a column (`Services/BuildJiraStore.cs`)

```csharp
public record UpdateColumnRequest(string? Name, int? WipLimit);

public BoardColumnDto UpdateColumn(string columnId, UpdateColumnRequest req, string actorId)
{
    RequireRole(actorId, UserRole.ADMIN, UserRole.PROJECT_MANAGER);
    lock (_lock)
    {
        var col = _state.BoardColumns.FirstOrDefault(c => c.Id == columnId)
            ?? throw new KeyNotFoundException("Column not found.");

        if (req.Name != null)
        {
            if (req.Name.Length < 1 || req.Name.Length > 50)
                throw new ArgumentException("Column name must be 1–50 characters.");
            col.Name = req.Name.Trim();
        }

        // WipLimit: null = no limit, 0 = disable, positive = set limit
        col.WipLimit = req.WipLimit == 0 ? null : req.WipLimit;

        Save();
        return new BoardColumnDto(col.Id, col.Name, col.Status.ToString(), col.Order, col.WipLimit);
    }
}
```

#### Step 2 — Wire endpoint (`Program.cs`)

```csharp
app.MapPatch("/api/columns/{id}", (string id, UpdateColumnRequest req,
    HttpRequest http, BuildJiraStore store) =>
{
    var actorId = http.Headers["x-user-id"].FirstOrDefault() ?? store.GetFirstUserId();
    return Results.Ok(store.UpdateColumn(id, req, actorId));
});
```

#### Step 3 — Frontend: inline column editor (`wwwroot/app.js`)

In `renderBoard()`, modify the column header HTML:

```javascript
function renderColumnHeader(col) {
  const wip = col.wipLimit ? `/ ${col.wipLimit}` : '';
  return `
    <div class="col-header">
      <span class="col-name">${col.name}</span>
      <span class="col-count">${colIssueCount} ${wip}</span>
      ${isAdminOrPm() ? `
        <button class="btn-col-settings" onclick="openColumnEditor('${col.id}')">⚙</button>
      ` : ''}
    </div>
    <div id="col-editor-${col.id}" class="col-editor" style="display:none">
      <input id="col-name-${col.id}" value="${col.name}" />
      <input id="col-wip-${col.id}" type="number" value="${col.wipLimit ?? ''}" placeholder="No limit" min="0" />
      <button onclick="saveColumnSettings('${col.id}')">Save</button>
      <button onclick="closeColumnEditor('${col.id}')">Cancel</button>
    </div>
  `;
}

function openColumnEditor(colId) {
  document.getElementById(`col-editor-${colId}`).style.display = 'block';
}

function closeColumnEditor(colId) {
  document.getElementById(`col-editor-${colId}`).style.display = 'none';
}

async function saveColumnSettings(colId) {
  const name = document.getElementById(`col-name-${colId}`).value;
  const wip = parseInt(document.getElementById(`col-wip-${colId}`).value) || 0;
  await request(`/api/columns/${colId}`, 'PATCH', { name, wipLimit: wip });
  closeColumnEditor(colId);
  await loadBoard();
}
```

---

---

## Story 18 — Issue History / Change Log

**As an engineer, I want to see a full change history for an issue so that I can understand how its scope and status evolved over time.**

### Acceptance Criteria
- The issue detail panel has a "History" tab alongside "Details" and "Comments"
- Each history entry shows: timestamp, actor, field changed, old value, new value
- History is derived from audit events tagged to the issue
- History is read-only
- Shows at most 100 entries

### Implementation Plan

#### Step 1 — Enrich audit event metadata in `UpdateIssue` (`Services/BuildJiraStore.cs`)

Update the audit event creation in `UpdateIssue` to store before/after values:

```csharp
// In UpdateIssue, before making changes, capture the before state:
var before = new
{
    status = issue.Status.ToString(),
    assigneeId = issue.AssigneeId,
    priority = issue.Priority.ToString(),
    storyPoints = issue.StoryPoints
};

// ... apply changes ...

var after = new
{
    status = issue.Status.ToString(),
    assigneeId = issue.AssigneeId,
    priority = issue.Priority.ToString(),
    storyPoints = issue.StoryPoints
};

_state.AuditEvents.Add(new AuditEvent
{
    ActorId = actorId,
    Action = "ISSUE_UPDATED",
    Entity = "Issue",
    EntityId = id,
    Metadata = System.Text.Json.JsonSerializer.Serialize(new { before, after })
});
```

#### Step 2 — Add store method for issue history (`Services/BuildJiraStore.cs`)

```csharp
public record IssueHistoryEntry(
    string Id, string ActorName, string Action, string? Metadata, DateTime CreatedAt
);

public List<IssueHistoryEntry> GetIssueHistory(string issueId)
{
    lock (_lock)
    {
        return _state.AuditEvents
            .Where(e => e.Entity == "Issue" && e.EntityId == issueId)
            .OrderByDescending(e => e.CreatedAt)
            .Take(100)
            .Select(e =>
            {
                var actor = _state.Users.FirstOrDefault(u => u.Id == e.ActorId);
                return new IssueHistoryEntry(e.Id, actor?.Name ?? "Unknown",
                    e.Action, e.Metadata, e.CreatedAt);
            })
            .ToList();
    }
}
```

#### Step 3 — Wire endpoint (`Program.cs`)

```csharp
app.MapGet("/api/issues/{id}/history", (string id, BuildJiraStore store) =>
    Results.Ok(store.GetIssueHistory(id)));
```

#### Step 4 — Frontend: history tab in the issue panel (`wwwroot/app.js`)

```javascript
async function loadIssueHistory(issueId) {
  const entries = await request(`/api/issues/${issueId}/history`);
  document.getElementById('history-list').innerHTML = entries.map(e => {
    let detail = '';
    if (e.metadata && e.action === 'ISSUE_UPDATED') {
      const m = JSON.parse(e.metadata);
      const changes = Object.keys(m.before || {})
        .filter(k => m.before[k] !== m.after[k])
        .map(k => `<em>${k}</em>: ${m.before[k] ?? '—'} → ${m.after[k] ?? '—'}`)
        .join(', ');
      if (changes) detail = `<small>${changes}</small>`;
    }
    return `<div class="history-entry">
      <strong>${e.actorName}</strong> ${e.action.toLowerCase().replace('_', ' ')}
      <span class="feed-time">${timeAgo(e.createdAt)}</span>
      ${detail}
    </div>`;
  }).join('') || '<p class="muted">No history yet.</p>';
}
```

#### Step 5 — HTML: tabs in the issue panel (`wwwroot/index.html`)

```html
<div class="panel-tabs">
  <button class="tab-btn active" onclick="switchTab('details')">Details</button>
  <button class="tab-btn" onclick="switchTab('comments')">Comments</button>
  <button class="tab-btn" onclick="switchTab('history')">History</button>
</div>
<div id="tab-details"><!-- existing panel fields --></div>
<div id="tab-comments" style="display:none"><div id="comments-list"></div></div>
<div id="tab-history" style="display:none"><div id="history-list"></div></div>
```

```javascript
function switchTab(name) {
  ['details', 'comments', 'history'].forEach(t => {
    document.getElementById(`tab-${t}`).style.display = t === name ? 'block' : 'none';
  });
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', ['details', 'comments', 'history'][i] === name);
  });
  if (name === 'comments') loadComments(currentIssueId);
  if (name === 'history') loadIssueHistory(currentIssueId);
}
```

---

---

## Story 19 — Epics & Issue Hierarchy

**As a project manager, I want to group issues under epics so that I can track large features as a collection of smaller stories and tasks.**

### Acceptance Criteria
- An epic is an issue of type `EPIC`
- Any story, task, or bug can be assigned to an epic via a parent reference
- A dedicated "Epics" view shows each epic with its child issues and progress
- The issue card shows the epic name/key as a small badge
- The board can be filtered by epic
- Epic progress is calculated as: Done count / Total child count

### Implementation Plan

#### Step 1 — Add `EpicId` to the `Issue` model (`Models/Domain.cs`)

```csharp
// Add to Issue class:
public string? EpicId { get; set; }
```

This is a self-referential foreign key: an issue can reference another issue (of type EPIC) as its parent.

#### Step 2 — Extend contracts (`Models/Contracts.cs`)

```csharp
// Add to UpdateIssueRequest:
string? EpicId

// Add to IssueDto:
string? EpicId
string? EpicKey
string? EpicName

public record EpicSummary(
    string Id, string Key, string Title,
    int TotalChildren, int DoneChildren, double ProgressPercent,
    List<IssueDto> Children
);
```

#### Step 3 — Add store method for epics view (`Services/BuildJiraStore.cs`)

```csharp
public List<EpicSummary> GetEpics(string projectKey)
{
    lock (_lock)
    {
        var project = _state.Projects.FirstOrDefault(p => p.Key == projectKey)
            ?? throw new KeyNotFoundException("Project not found.");

        var epics = _state.Issues
            .Where(i => i.ProjectId == project.Id && i.Type == IssueType.EPIC)
            .ToList();

        return epics.Select(epic =>
        {
            var children = _state.Issues
                .Where(i => i.EpicId == epic.Id)
                .Select(MapIssueDto)
                .ToList();
            int done = children.Count(c => c.Status == "DONE");
            double progress = children.Count > 0
                ? Math.Round((double)done / children.Count * 100, 1)
                : 0;
            return new EpicSummary(epic.Id, epic.Key, epic.Title,
                children.Count, done, progress, children);
        }).ToList();
    }
}
```

In `UpdateIssue`, add validation:

```csharp
if (req.EpicId != null)
{
    var epic = _state.Issues.FirstOrDefault(i => i.Id == req.EpicId);
    if (epic == null || epic.Type != IssueType.EPIC)
        throw new ArgumentException("EpicId must reference a valid EPIC issue.");
    issue.EpicId = req.EpicId;
}
```

In `MapIssueDto`, populate epic fields:

```csharp
var epic = issue.EpicId != null
    ? _state.Issues.FirstOrDefault(i => i.Id == issue.EpicId)
    : null;
// pass EpicId, epic?.Key, epic?.Title into the DTO
```

#### Step 4 — Wire endpoint (`Program.cs`)

```csharp
app.MapGet("/api/projects/{key}/epics", (string key, BuildJiraStore store) =>
    Results.Ok(store.GetEpics(key)));
```

#### Step 5 — Frontend: epic badge on cards and epics view (`wwwroot/app.js`)

On issue cards:

```javascript
${issue.epicKey
  ? `<span class="epic-badge" style="background:#6e40c9;color:#fff">${issue.epicKey}</span>`
  : ''}
```

Epic progress view:

```javascript
async function showEpicsView() {
  const epics = await request(`/api/projects/${currentProjectKey}/epics`);
  document.getElementById('epics-container').innerHTML = epics.map(e => `
    <div class="epic-card">
      <div class="epic-header">
        <span class="badge badge-purple">${e.key}</span>
        <strong>${e.title}</strong>
        <span>${e.doneChildren}/${e.totalChildren} done</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${e.progressPercent}%"></div>
      </div>
      <div class="epic-children">
        ${e.children.map(c =>
          `<div class="mini-card">[${c.status}] ${c.key}: ${c.title}</div>`
        ).join('')}
      </div>
    </div>
  `).join('') || '<p>No epics in this project.</p>';
}
```

---

---

## Story 20 — Keyboard Shortcuts

**As a power user, I want keyboard shortcuts for common actions so that I can navigate and triage issues without taking my hands off the keyboard.**

### Acceptance Criteria
- `?` opens a keyboard shortcut help overlay
- `n` opens the "New Issue" modal
- `f` focuses the search/filter input
- `j` / `k` navigate between issue cards on the board
- `Enter` opens the highlighted issue in the panel
- `Escape` closes any open modal or panel
- `b` toggles bulk selection mode
- Shortcuts are disabled when focus is inside a text input or textarea
- A help overlay lists all shortcuts

### Implementation Plan

#### Step 1 — No backend changes needed

Keyboard shortcuts are entirely a frontend feature.

#### Step 2 — Create a `shortcuts.js` module in wwwroot

Create `wwwroot/shortcuts.js`:

```javascript
// All keyboard shortcut bindings for BuildJira
// Shortcuts are skipped when the user is typing in a field.

const SHORTCUTS = [
  { key: '?',      description: 'Show keyboard shortcut help' },
  { key: 'n',      description: 'New issue' },
  { key: 'f',      description: 'Focus search/filter' },
  { key: 'j',      description: 'Next issue card' },
  { key: 'k',      description: 'Previous issue card' },
  { key: 'Enter',  description: 'Open highlighted issue' },
  { key: 'Escape', description: 'Close panel / modal' },
  { key: 'b',      description: 'Toggle bulk selection mode' },
];

let focusedCardIndex = -1;

function isTyping() {
  const el = document.activeElement;
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

export function initShortcuts({ onNewIssue, onToggleBulk, onOpenIssue, onClosePanel }) {
  document.addEventListener('keydown', (e) => {
    if (isTyping()) return;

    switch (e.key) {
      case '?':
        e.preventDefault();
        document.getElementById('shortcuts-modal').showModal();
        break;

      case 'n':
        e.preventDefault();
        onNewIssue();
        break;

      case 'f':
        e.preventDefault();
        document.getElementById('search-input')?.focus();
        break;

      case 'j':
      case 'k': {
        e.preventDefault();
        const cards = [...document.querySelectorAll('.issue-card')];
        if (cards.length === 0) break;
        focusedCardIndex = e.key === 'j'
          ? Math.min(focusedCardIndex + 1, cards.length - 1)
          : Math.max(focusedCardIndex - 1, 0);
        cards.forEach((c, i) =>
          c.classList.toggle('keyboard-focused', i === focusedCardIndex));
        cards[focusedCardIndex]?.scrollIntoView({ block: 'nearest' });
        break;
      }

      case 'Enter':
        e.preventDefault();
        if (focusedCardIndex >= 0) {
          const cards = [...document.querySelectorAll('.issue-card')];
          const card = cards[focusedCardIndex];
          if (card) onOpenIssue(card.dataset.issueId);
        }
        break;

      case 'Escape':
        e.preventDefault();
        onClosePanel();
        // Close any open <dialog>
        document.querySelectorAll('dialog[open]').forEach(d => d.close());
        break;

      case 'b':
        e.preventDefault();
        onToggleBulk();
        break;
    }
  });
}
```

#### Step 3 — Import and wire shortcuts in `app.js` (`wwwroot/app.js`)

At the bottom of `app.js`, after the board has booted:

```javascript
import { initShortcuts } from './shortcuts.js';

// Wire shortcuts to existing functions
initShortcuts({
  onNewIssue: () => document.getElementById('new-issue-modal').showModal(),
  onToggleBulk: toggleBulkMode,
  onOpenIssue: (id) => openIssuePanel(id),
  onClosePanel: () => {
    document.getElementById('issue-panel').style.display = 'none';
    focusedCardIndex = -1;
    document.querySelectorAll('.keyboard-focused').forEach(c =>
      c.classList.remove('keyboard-focused'));
  }
});
```

#### Step 4 — Add the help overlay HTML (`wwwroot/index.html`)

```html
<dialog id="shortcuts-modal">
  <h3>Keyboard Shortcuts</h3>
  <table>
    <tr><th>Key</th><th>Action</th></tr>
    <tr><td><kbd>?</kbd></td><td>Show this help</td></tr>
    <tr><td><kbd>n</kbd></td><td>New issue</td></tr>
    <tr><td><kbd>f</kbd></td><td>Focus search</td></tr>
    <tr><td><kbd>j</kbd> / <kbd>k</kbd></td><td>Navigate cards</td></tr>
    <tr><td><kbd>Enter</kbd></td><td>Open selected issue</td></tr>
    <tr><td><kbd>Esc</kbd></td><td>Close panel</td></tr>
    <tr><td><kbd>b</kbd></td><td>Bulk select mode</td></tr>
  </table>
  <button onclick="this.closest('dialog').close()">Close</button>
</dialog>
```

#### Step 5 — Add `keyboard-focused` CSS (`wwwroot/styles.css`)

```css
.issue-card.keyboard-focused {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
kbd {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 12px;
}
```

---

---

## Summary Table

| # | Story | Backend Change | Frontend Change | Complexity |
|---|-------|---------------|-----------------|------------|
| 1 | Issue Comments | New model + 3 endpoints | Comments section in panel | Low |
| 2 | Sprint Management | New enum + 4 endpoints | Sprint modal | Medium |
| 3 | Issue Linking | New model + 3 endpoints | Links section in panel | Low |
| 4 | Time Tracking | New model + 2 endpoints | Work log section + card badge | Low |
| 5 | Burndown Chart | New model + background service | SVG chart render | High |
| 6 | User Management | Extend User + 3 endpoints | Team management page | Medium |
| 7 | Project Creation | Extend Project + 2 endpoints | New project modal | Medium |
| 8 | Bulk Operations | 1 bulk endpoint | Floating action bar | Medium |
| 9 | Saved Filters | New model + 3 endpoints | Filter dropdown + save | Medium |
| 10 | CSV Export | 1 streaming endpoint | Download trigger | Low |
| 11 | Audit Dashboard | Extend existing endpoint | Full governance page | Medium |
| 12 | Swimlanes | None | Board grouping render logic | Medium |
| 13 | Issue Templates | New model + 3 endpoints | Template picker in new-issue modal | Medium |
| 14 | Webhooks | New model + dispatcher service | Webhook management page | High |
| 15 | Labels / Tags | Extend Issue model | Label chips + autocomplete | Low |
| 16 | Activity Feed | Extend AuditEvent + 2 endpoints | Notification bell + feed panel | Medium |
| 17 | WIP Limit Config UI | 1 PATCH endpoint | Inline column editor | Low |
| 18 | Issue History | Enrich audit metadata + 1 endpoint | History tab in panel | Low |
| 19 | Epics | Extend Issue model + 1 endpoint | Epic badge + epics view | Medium |
| 20 | Keyboard Shortcuts | None | `shortcuts.js` module + help overlay | Low |
