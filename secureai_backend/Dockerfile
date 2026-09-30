# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["secureai_backend/secureai_backend.csproj", "secureai_backend/"]
RUN dotnet restore "secureai_backend/secureai_backend.csproj"

COPY . .
WORKDIR "/src/secureai_backend"
RUN dotnet build "secureai_backend.csproj" -c Release -o /app/build
RUN dotnet publish "secureai_backend.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:7124
EXPOSE 7124

ENTRYPOINT ["dotnet", "secureai_backend.dll"]
