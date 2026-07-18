namespace BuildJira.Api.Services;

public sealed class BuildJiraOptions
{
    public string DataFile { get; set; } = "Data/buildjira-data.json";
    public string WebOrigin { get; set; } = "http://localhost:5173";
}
