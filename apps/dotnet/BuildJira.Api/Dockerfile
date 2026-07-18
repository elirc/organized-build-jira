FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY apps/dotnet/BuildJira.Api/BuildJira.Api.csproj apps/dotnet/BuildJira.Api/
RUN dotnet restore apps/dotnet/BuildJira.Api/BuildJira.Api.csproj
COPY apps/dotnet/BuildJira.Api apps/dotnet/BuildJira.Api
RUN dotnet publish apps/dotnet/BuildJira.Api/BuildJira.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "BuildJira.Api.dll"]
