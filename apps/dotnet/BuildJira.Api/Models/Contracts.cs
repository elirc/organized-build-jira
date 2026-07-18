namespace BuildJira.Api.Models;

public sealed record ErrorEnvelope(ErrorBody Error);

public sealed record ErrorBody(string Code, string Message);

public sealed record ProjectSummary(
    string Id,
    string Key,
    string Name,
    string Description,
    ProjectHealth Health,
    UserDto Lead,
    int IssueCount,
    int DoneCount,
    DateTimeOffset UpdatedAt);

public sealed record UserDto(string Id, string Name, string Email, string? AvatarUrl, UserRole Role);

public sealed record BoardColumnDto(string Id, string Name, IssueStatus Status, int Order, int? WipLimit);

public sealed record IssueDto(
    string Id,
    string Key,
    string Title,
    string? Description,
    IssueStatus Status,
    IssueType Type,
    IssuePriority Priority,
    int? StoryPoints,
    int Rank,
    DateTimeOffset? DueDate,
    UserDto? Assignee,
    UserDto Reporter,
    DateTimeOffset UpdatedAt);

public sealed record SprintDto(string Id, string Name, string Goal, DateTimeOffset StartsAt, DateTimeOffset EndsAt);

public sealed record BoardResponse(ProjectSummary Project, List<BoardColumnDto> Columns, List<IssueDto> Issues, List<UserDto> Team, SprintDto? ActiveSprint);

public sealed record CreateIssueInput(
    string ProjectId,
    string Title,
    string? Description,
    IssueType? Type,
    IssuePriority? Priority,
    string? AssigneeId,
    int? StoryPoints);

public sealed record AuditEventDto(
    string Id,
    UserDto? Actor,
    string Action,
    string Entity,
    string EntityId,
    Dictionary<string, object?>? Metadata,
    DateTimeOffset CreatedAt);

public sealed record HealthResponse(string Status, string Service, DateTimeOffset CheckedAt);
