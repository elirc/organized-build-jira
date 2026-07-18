using System.Text.Json;
using System.Text.Json.Serialization;
using BuildJira.Api.Models;
using Microsoft.Extensions.Options;

namespace BuildJira.Api.Services;

public sealed class BuildJiraStore
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true
    };

    static BuildJiraStore()
    {
        JsonOptions.Converters.Add(new JsonStringEnumConverter());
    }

    private readonly object sync = new();
    private readonly string dataFile;
    private BuildJiraState state;

    public BuildJiraStore(IOptions<BuildJiraOptions> options, IWebHostEnvironment environment)
    {
        dataFile = Path.IsPathRooted(options.Value.DataFile)
            ? options.Value.DataFile
            : Path.Combine(environment.ContentRootPath, options.Value.DataFile);

        Directory.CreateDirectory(Path.GetDirectoryName(dataFile)!);
        state = LoadOrSeed();
    }

    public HealthResponse GetHealth() => new("ok", "buildjira-api-dotnet", DateTimeOffset.UtcNow);

    public List<ProjectSummary> GetProjects()
    {
        lock (sync)
        {
            return state.Projects
                .OrderByDescending(project => project.UpdatedAt)
                .Select(ToProjectSummary)
                .ToList();
        }
    }

    public BoardResponse? GetBoard(string key)
    {
        lock (sync)
        {
            var project = state.Projects.FirstOrDefault(item => string.Equals(item.Key, key, StringComparison.OrdinalIgnoreCase));
            if (project is null)
            {
                return null;
            }

            var columns = state.Columns
                .Where(column => column.ProjectId == project.Id)
                .OrderBy(column => column.Order)
                .Select(column => new BoardColumnDto(column.Id, column.Name, column.Status, column.Order, column.WipLimit))
                .ToList();

            var issues = state.Issues
                .Where(issue => issue.ProjectId == project.Id)
                .OrderBy(issue => issue.Status)
                .ThenBy(issue => issue.Rank)
                .Select(ToIssueDto)
                .ToList();

            var team = state.Users
                .OrderBy(user => user.Name)
                .Select(ToUserDto)
                .ToList();

            var sprint = state.Sprints
                .Where(item => item.ProjectId == project.Id)
                .OrderByDescending(item => item.StartsAt)
                .Select(item => new SprintDto(item.Id, item.Name, item.Goal, item.StartsAt, item.EndsAt))
                .FirstOrDefault();

            return new BoardResponse(ToProjectSummary(project), columns, issues, team, sprint);
        }
    }

    public User? GetActor(string? requestedUserId)
    {
        lock (sync)
        {
            var actor = string.IsNullOrWhiteSpace(requestedUserId)
                ? state.Users.OrderBy(user => user.CreatedAt).FirstOrDefault()
                : state.Users.FirstOrDefault(user => user.Id == requestedUserId);

            return actor is null ? null : Clone(actor);
        }
    }

    public IssueDto? CreateIssue(CreateIssueInput input, User actor, out ErrorEnvelope? error)
    {
        error = null;

        if (!CanWriteIssues(actor))
        {
            error = Forbidden();
            return null;
        }

        if (string.IsNullOrWhiteSpace(input.Title) || input.Title.Length < 3 || input.Title.Length > 160)
        {
            error = Validation("Title must be between 3 and 160 characters.");
            return null;
        }

        if (input.Description is { Length: > 4000 })
        {
            error = Validation("Description must be 4000 characters or less.");
            return null;
        }

        if (input.StoryPoints is < 0 or > 100)
        {
            error = Validation("Story points must be between 0 and 100.");
            return null;
        }

        lock (sync)
        {
            var project = state.Projects.FirstOrDefault(item => item.Id == input.ProjectId);
            if (project is null)
            {
                error = NotFound("PROJECT_NOT_FOUND", "Project was not found.");
                return null;
            }

            var projectIssues = state.Issues.Where(issue => issue.ProjectId == project.Id).ToList();
            var nextNumber = projectIssues
                .Select(issue => int.TryParse(issue.Key.Replace($"{project.Key}-", "", StringComparison.OrdinalIgnoreCase), out var number) ? number : 0)
                .DefaultIfEmpty(0)
                .Max() + 1;

            var now = DateTimeOffset.UtcNow;
            var issue = new Issue
            {
                Id = NewId(),
                Key = $"{project.Key}-{nextNumber}",
                ProjectId = project.Id,
                Title = input.Title.Trim(),
                Description = input.Description,
                Status = IssueStatus.TODO,
                Type = input.Type ?? IssueType.TASK,
                Priority = input.Priority ?? IssuePriority.MEDIUM,
                AssigneeId = input.AssigneeId,
                StoryPoints = input.StoryPoints,
                ReporterId = actor.Id,
                Rank = projectIssues.Select(item => item.Rank).DefaultIfEmpty(0).Max() + 10,
                CreatedAt = now,
                UpdatedAt = now
            };

            state.Issues.Add(issue);
            project.UpdatedAt = now;
            state.AuditEvents.Add(new AuditEvent
            {
                Id = NewId(),
                ActorId = actor.Id,
                Action = "issue.created",
                Entity = "Issue",
                EntityId = issue.Id,
                Metadata = new Dictionary<string, object?> { ["key"] = issue.Key },
                CreatedAt = now
            });

            Save();
            return ToIssueDto(issue);
        }
    }

    public IssueDto? UpdateIssue(string issueId, JsonElement body, User actor, out ErrorEnvelope? error)
    {
        error = null;

        if (!CanWriteIssues(actor))
        {
            error = Forbidden();
            return null;
        }

        lock (sync)
        {
            var issue = state.Issues.FirstOrDefault(item => item.Id == issueId);
            if (issue is null)
            {
                error = NotFound("ISSUE_NOT_FOUND", "Issue was not found.");
                return null;
            }

            var before = new
            {
                issue.Title,
                issue.Description,
                issue.Status,
                issue.Priority,
                issue.AssigneeId,
                issue.StoryPoints,
                issue.Rank,
                issue.DueDate
            };

            if (!ApplyPatch(issue, body, out error))
            {
                return null;
            }

            issue.UpdatedAt = DateTimeOffset.UtcNow;
            var project = state.Projects.FirstOrDefault(item => item.Id == issue.ProjectId);
            if (project is not null)
            {
                project.UpdatedAt = issue.UpdatedAt;
            }

            state.AuditEvents.Add(new AuditEvent
            {
                Id = NewId(),
                ActorId = actor.Id,
                Action = "issue.updated",
                Entity = "Issue",
                EntityId = issue.Id,
                Metadata = new Dictionary<string, object?>
                {
                    ["before"] = before,
                    ["after"] = JsonSerializer.Deserialize<Dictionary<string, object?>>(body.GetRawText(), JsonOptions)
                },
                CreatedAt = issue.UpdatedAt
            });

            Save();
            return ToIssueDto(issue);
        }
    }

    public List<AuditEventDto>? GetAudit(User actor, out ErrorEnvelope? error)
    {
        error = null;

        if (actor.Role is not (UserRole.ADMIN or UserRole.PROJECT_MANAGER))
        {
            error = Forbidden();
            return null;
        }

        lock (sync)
        {
            return state.AuditEvents
                .OrderByDescending(item => item.CreatedAt)
                .Take(50)
                .Select(item => new AuditEventDto(
                    item.Id,
                    item.ActorId is null ? null : state.Users.Where(user => user.Id == item.ActorId).Select(ToUserDto).FirstOrDefault(),
                    item.Action,
                    item.Entity,
                    item.EntityId,
                    item.Metadata,
                    item.CreatedAt))
                .ToList();
        }
    }

    private bool ApplyPatch(Issue issue, JsonElement body, out ErrorEnvelope? error)
    {
        error = null;

        if (body.ValueKind is not JsonValueKind.Object)
        {
            error = Validation("Request body must be a JSON object.");
            return false;
        }

        if (body.TryGetProperty("title", out var title))
        {
            var value = title.GetString();
            if (string.IsNullOrWhiteSpace(value) || value.Length < 3 || value.Length > 160)
            {
                error = Validation("Title must be between 3 and 160 characters.");
                return false;
            }

            issue.Title = value.Trim();
        }

        if (body.TryGetProperty("description", out var description))
        {
            if (description.ValueKind == JsonValueKind.Null)
            {
                issue.Description = null;
            }
            else
            {
                var value = description.GetString() ?? "";
                if (value.Length > 4000)
                {
                    error = Validation("Description must be 4000 characters or less.");
                    return false;
                }

                issue.Description = value;
            }
        }

        if (body.TryGetProperty("status", out var status))
        {
            if (!TryReadEnum<IssueStatus>(status, out var value, out error))
            {
                return false;
            }

            issue.Status = value;
        }

        if (body.TryGetProperty("priority", out var priority))
        {
            if (!TryReadEnum<IssuePriority>(priority, out var value, out error))
            {
                return false;
            }

            issue.Priority = value;
        }

        if (body.TryGetProperty("assigneeId", out var assigneeId))
        {
            issue.AssigneeId = assigneeId.ValueKind == JsonValueKind.Null ? null : assigneeId.GetString();
        }

        if (body.TryGetProperty("storyPoints", out var storyPoints))
        {
            if (storyPoints.ValueKind == JsonValueKind.Null)
            {
                issue.StoryPoints = null;
            }
            else if (storyPoints.TryGetInt32(out var value) && value is >= 0 and <= 100)
            {
                issue.StoryPoints = value;
            }
            else
            {
                error = Validation("Story points must be an integer between 0 and 100.");
                return false;
            }
        }

        if (body.TryGetProperty("rank", out var rank))
        {
            if (rank.TryGetInt32(out var value) && value >= 0)
            {
                issue.Rank = value;
            }
            else
            {
                error = Validation("Rank must be a non-negative integer.");
                return false;
            }
        }

        if (body.TryGetProperty("dueDate", out var dueDate))
        {
            if (dueDate.ValueKind == JsonValueKind.Null)
            {
                issue.DueDate = null;
            }
            else if (DateTimeOffset.TryParse(dueDate.GetString(), out var value))
            {
                issue.DueDate = value;
            }
            else
            {
                error = Validation("Due date must be an ISO-8601 date-time string or null.");
                return false;
            }
        }

        return true;
    }

    private static bool TryReadEnum<T>(JsonElement element, out T value, out ErrorEnvelope? error)
        where T : struct, Enum
    {
        error = null;
        value = default;

        if (element.ValueKind == JsonValueKind.String && Enum.TryParse<T>(element.GetString(), ignoreCase: false, out var parsed))
        {
            value = parsed;
            return true;
        }

        error = Validation($"{typeof(T).Name} contains an invalid value.");
        return false;
    }

    private bool CanWriteIssues(User actor) => actor.Role is UserRole.ADMIN or UserRole.PROJECT_MANAGER or UserRole.ENGINEER;

    private ProjectSummary ToProjectSummary(Project project)
    {
        var issues = state.Issues.Where(issue => issue.ProjectId == project.Id).ToList();
        return new ProjectSummary(
            project.Id,
            project.Key,
            project.Name,
            project.Description,
            project.Health,
            ToUserDto(state.Users.First(user => user.Id == project.LeadId)),
            issues.Count,
            issues.Count(issue => issue.Status == IssueStatus.DONE),
            project.UpdatedAt);
    }

    private IssueDto ToIssueDto(Issue issue)
    {
        return new IssueDto(
            issue.Id,
            issue.Key,
            issue.Title,
            issue.Description,
            issue.Status,
            issue.Type,
            issue.Priority,
            issue.StoryPoints,
            issue.Rank,
            issue.DueDate,
            issue.AssigneeId is null ? null : state.Users.Where(user => user.Id == issue.AssigneeId).Select(ToUserDto).FirstOrDefault(),
            ToUserDto(state.Users.First(user => user.Id == issue.ReporterId)),
            issue.UpdatedAt);
    }

    private static UserDto ToUserDto(User user) => new(user.Id, user.Name, user.Email, user.AvatarUrl, user.Role);

    private BuildJiraState LoadOrSeed()
    {
        if (File.Exists(dataFile))
        {
            var json = File.ReadAllText(dataFile);
            if (!string.IsNullOrWhiteSpace(json))
            {
                return JsonSerializer.Deserialize<BuildJiraState>(json, JsonOptions) ?? SeedState();
            }
        }

        var seeded = SeedState();
        state = seeded;
        Save();
        return seeded;
    }

    private void Save()
    {
        File.WriteAllText(dataFile, JsonSerializer.Serialize(state, JsonOptions));
    }

    private static BuildJiraState SeedState()
    {
        var now = DateTimeOffset.UtcNow;
        var alex = UserSeed("usr_alex", "Alex Morgan", "alex@buildjira.test", UserRole.PROJECT_MANAGER);
        var priya = UserSeed("usr_priya", "Priya Shah", "priya@buildjira.test", UserRole.ENGINEER);
        var mateo = UserSeed("usr_mateo", "Mateo Ruiz", "mateo@buildjira.test", UserRole.ENGINEER);
        var sam = UserSeed("usr_sam", "Sam Taylor", "sam@buildjira.test", UserRole.VIEWER);

        var atlas = new Project
        {
            Id = "prj_atlas",
            Key = "ATLAS",
            Name = "Atlas Platform",
            Description = "Enterprise work management for product and engineering teams.",
            Health = ProjectHealth.ON_TRACK,
            LeadId = alex.Id,
            CreatedAt = now,
            UpdatedAt = now
        };

        var beacon = new Project
        {
            Id = "prj_beacon",
            Key = "BEACON",
            Name = "Beacon Rollout",
            Description = "Operational launch planning for customer-facing initiatives.",
            Health = ProjectHealth.AT_RISK,
            LeadId = alex.Id,
            CreatedAt = now,
            UpdatedAt = now
        };

        var sprint = new Sprint
        {
            Id = "spr_atlas_12",
            ProjectId = atlas.Id,
            Name = "Atlas Sprint 12",
            Goal = "Harden workflow visibility for enterprise pilots",
            StartsAt = DateTimeOffset.Parse("2026-05-18T08:00:00.000Z"),
            EndsAt = DateTimeOffset.Parse("2026-05-31T18:00:00.000Z")
        };

        return new BuildJiraState
        {
            Users = [alex, priya, mateo, sam],
            Projects = [atlas, beacon],
            Columns =
            [
                ..ColumnSeed(atlas.Id),
                ..ColumnSeed(beacon.Id)
            ],
            Sprints = [sprint],
            Issues =
            [
                IssueSeed("iss_atlas_101", "ATLAS-101", atlas.Id, sprint.Id, "Add portfolio health indicators", "Show delivery health and completion ratios on the project portfolio.", IssueStatus.DONE, IssueType.STORY, IssuePriority.HIGH, 5, 10, priya.Id, alex.Id),
                IssueSeed("iss_atlas_102", "ATLAS-102", atlas.Id, sprint.Id, "Support WIP limits on board columns", "Surface limits and overloaded states for engineering workflows.", IssueStatus.IN_REVIEW, IssueType.TASK, IssuePriority.MEDIUM, 3, 20, mateo.Id, alex.Id),
                IssueSeed("iss_atlas_103", "ATLAS-103", atlas.Id, sprint.Id, "Fix stale issue counts after status updates", "Counts should refresh immediately when an issue changes status.", IssueStatus.IN_PROGRESS, IssueType.BUG, IssuePriority.CRITICAL, 2, 30, priya.Id, mateo.Id),
                IssueSeed("iss_atlas_104", "ATLAS-104", atlas.Id, sprint.Id, "Design audit log data model", "Create a minimal audit trail for issue mutations.", IssueStatus.TODO, IssueType.TASK, IssuePriority.HIGH, 5, 40, mateo.Id, alex.Id),
                IssueSeed("iss_atlas_105", "ATLAS-105", atlas.Id, null, "Explore SLA reporting for support queues", "Discovery task for later enterprise reporting work.", IssueStatus.BACKLOG, IssueType.EPIC, IssuePriority.LOW, 13, 50, null, alex.Id),
                IssueSeed("iss_beacon_1", "BEACON-1", beacon.Id, null, "Prepare release readiness checklist", "Track launch dependencies for customer operations.", IssueStatus.IN_PROGRESS, IssueType.STORY, IssuePriority.HIGH, 8, 10, priya.Id, alex.Id)
            ],
            AuditEvents =
            [
                new AuditEvent
                {
                    Id = "aud_seed",
                    ActorId = alex.Id,
                    Action = "project.seeded",
                    Entity = "Project",
                    EntityId = atlas.Id,
                    Metadata = new Dictionary<string, object?> { ["source"] = "seed" },
                    CreatedAt = now
                }
            ]
        };
    }

    private static User UserSeed(string id, string name, string email, UserRole role) => new()
    {
        Id = id,
        Name = name,
        Email = email,
        Role = role,
        AvatarUrl = $"https://api.dicebear.com/8.x/initials/svg?seed={Uri.EscapeDataString(name)}",
        CreatedAt = DateTimeOffset.UtcNow
    };

    private static List<BoardColumn> ColumnSeed(string projectId)
    {
        return
        [
            new() { Id = NewId(), ProjectId = projectId, Name = "Backlog", Status = IssueStatus.BACKLOG, Order = 0, WipLimit = 20 },
            new() { Id = NewId(), ProjectId = projectId, Name = "Selected", Status = IssueStatus.TODO, Order = 1, WipLimit = 10 },
            new() { Id = NewId(), ProjectId = projectId, Name = "In Progress", Status = IssueStatus.IN_PROGRESS, Order = 2, WipLimit = 5 },
            new() { Id = NewId(), ProjectId = projectId, Name = "Code Review", Status = IssueStatus.IN_REVIEW, Order = 3, WipLimit = 4 },
            new() { Id = NewId(), ProjectId = projectId, Name = "Done", Status = IssueStatus.DONE, Order = 4, WipLimit = null }
        ];
    }

    private static Issue IssueSeed(
        string id,
        string key,
        string projectId,
        string? sprintId,
        string title,
        string description,
        IssueStatus status,
        IssueType type,
        IssuePriority priority,
        int storyPoints,
        int rank,
        string? assigneeId,
        string reporterId)
    {
        var now = DateTimeOffset.UtcNow;
        return new Issue
        {
            Id = id,
            Key = key,
            ProjectId = projectId,
            SprintId = sprintId,
            Title = title,
            Description = description,
            Status = status,
            Type = type,
            Priority = priority,
            StoryPoints = storyPoints,
            Rank = rank,
            AssigneeId = assigneeId,
            ReporterId = reporterId,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    private static ErrorEnvelope Validation(string message) => new(new ErrorBody("VALIDATION_ERROR", message));

    private static ErrorEnvelope Forbidden() => new(new ErrorBody("FORBIDDEN", "Insufficient role for this action."));

    private static ErrorEnvelope NotFound(string code, string message) => new(new ErrorBody(code, message));

    private static string NewId() => Guid.NewGuid().ToString("n");

    private static T Clone<T>(T value) => JsonSerializer.Deserialize<T>(JsonSerializer.Serialize(value, JsonOptions), JsonOptions)!;
}
