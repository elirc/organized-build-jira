using System.Text.Json;
using System.Text.Json.Serialization;
using BuildJira.Api.Models;
using BuildJira.Api.Services;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<BuildJiraOptions>(builder.Configuration.GetSection("BuildJira"));
builder.Services.Configure<JsonOptions>(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});
builder.Services.AddSingleton<BuildJiraStore>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("BuildJiraWeb", policy =>
    {
        var buildJira = builder.Configuration.GetSection("BuildJira").Get<BuildJiraOptions>() ?? new BuildJiraOptions();
        policy.WithOrigins(buildJira.WebOrigin)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors("BuildJiraWeb");

app.MapGet("/health", (BuildJiraStore store) => store.GetHealth());

var api = app.MapGroup("/api");

api.MapGet("/projects", (BuildJiraStore store) => store.GetProjects());

api.MapGet("/projects/{key}/board", (string key, BuildJiraStore store) =>
{
    var board = store.GetBoard(key);
    return board is null
        ? Results.NotFound(new ErrorEnvelope(new ErrorBody("PROJECT_NOT_FOUND", "Project was not found.")))
        : Results.Ok(board);
});

api.MapPost("/issues", (CreateIssueInput input, HttpContext context, BuildJiraStore store) =>
{
    var actor = ResolveActor(context, store);
    if (actor is null)
    {
        return Results.Json(new ErrorEnvelope(new ErrorBody("UNAUTHENTICATED", "No actor is available.")), statusCode: StatusCodes.Status401Unauthorized);
    }

    var issue = store.CreateIssue(input, actor, out var error);
    return error is not null
        ? ToProblemResult(error)
        : Results.Created($"/api/issues/{issue!.Id}", issue);
});

api.MapPatch("/issues/{id}", async (string id, HttpContext context, BuildJiraStore store) =>
{
    var actor = ResolveActor(context, store);
    if (actor is null)
    {
        return Results.Json(new ErrorEnvelope(new ErrorBody("UNAUTHENTICATED", "No actor is available.")), statusCode: StatusCodes.Status401Unauthorized);
    }

    using var document = await JsonDocument.ParseAsync(context.Request.Body);
    var issue = store.UpdateIssue(id, document.RootElement.Clone(), actor, out var error);
    return error is not null
        ? ToProblemResult(error)
        : Results.Ok(issue);
});

api.MapGet("/audit", (HttpContext context, BuildJiraStore store) =>
{
    var actor = ResolveActor(context, store);
    if (actor is null)
    {
        return Results.Json(new ErrorEnvelope(new ErrorBody("UNAUTHENTICATED", "No actor is available.")), statusCode: StatusCodes.Status401Unauthorized);
    }

    var events = store.GetAudit(actor, out var error);
    return error is not null
        ? ToProblemResult(error)
        : Results.Ok(events);
});

app.MapFallbackToFile("index.html");

app.Run();

static User? ResolveActor(HttpContext context, BuildJiraStore store)
{
    var requestedUserId = context.Request.Headers.TryGetValue("x-user-id", out var value) ? value.ToString() : null;
    return store.GetActor(requestedUserId);
}

static IResult ToProblemResult(ErrorEnvelope envelope)
{
    var statusCode = envelope.Error.Code switch
    {
        "VALIDATION_ERROR" => StatusCodes.Status400BadRequest,
        "FORBIDDEN" => StatusCodes.Status403Forbidden,
        "PROJECT_NOT_FOUND" or "ISSUE_NOT_FOUND" => StatusCodes.Status404NotFound,
        _ => StatusCodes.Status500InternalServerError
    };

    return Results.Json(envelope, statusCode: statusCode);
}
