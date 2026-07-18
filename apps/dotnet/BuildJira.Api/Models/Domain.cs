namespace BuildJira.Api.Models;

public enum IssueStatus
{
    BACKLOG,
    TODO,
    IN_PROGRESS,
    IN_REVIEW,
    DONE
}

public enum IssuePriority
{
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}

public enum IssueType
{
    STORY,
    TASK,
    BUG,
    EPIC
}

public enum UserRole
{
    ADMIN,
    PROJECT_MANAGER,
    ENGINEER,
    VIEWER
}

public enum ProjectHealth
{
    ON_TRACK,
    AT_RISK,
    OFF_TRACK
}

public sealed class User
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string? AvatarUrl { get; set; }
    public UserRole Role { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class Project
{
    public string Id { get; set; } = "";
    public string Key { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public ProjectHealth Health { get; set; }
    public string LeadId { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class BoardColumn
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public IssueStatus Status { get; set; }
    public int Order { get; set; }
    public int? WipLimit { get; set; }
    public string ProjectId { get; set; } = "";
}

public sealed class Sprint
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Goal { get; set; } = "";
    public DateTimeOffset StartsAt { get; set; }
    public DateTimeOffset EndsAt { get; set; }
    public string ProjectId { get; set; } = "";
}

public sealed class Issue
{
    public string Id { get; set; } = "";
    public string Key { get; set; } = "";
    public string ProjectId { get; set; } = "";
    public string? SprintId { get; set; }
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public IssueStatus Status { get; set; } = IssueStatus.TODO;
    public IssueType Type { get; set; } = IssueType.TASK;
    public IssuePriority Priority { get; set; } = IssuePriority.MEDIUM;
    public int? StoryPoints { get; set; }
    public int Rank { get; set; }
    public DateTimeOffset? DueDate { get; set; }
    public string? AssigneeId { get; set; }
    public string ReporterId { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class AuditEvent
{
    public string Id { get; set; } = "";
    public string? ActorId { get; set; }
    public string Action { get; set; } = "";
    public string Entity { get; set; } = "";
    public string EntityId { get; set; } = "";
    public Dictionary<string, object?>? Metadata { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class BuildJiraState
{
    public List<User> Users { get; set; } = [];
    public List<Project> Projects { get; set; } = [];
    public List<BoardColumn> Columns { get; set; } = [];
    public List<Sprint> Sprints { get; set; } = [];
    public List<Issue> Issues { get; set; } = [];
    public List<AuditEvent> AuditEvents { get; set; } = [];
}
