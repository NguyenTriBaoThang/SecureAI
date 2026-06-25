using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using secureai_backend.Data;
using secureai_backend.Hubs;
using secureai_backend.Middleware;
using secureai_backend.Services;

var builder = WebApplication.CreateBuilder(args);

var connectionString = RequireConfig(
    builder.Configuration,
    "ConnectionStrings:DefaultConnection",
    "Set ConnectionStrings__DefaultConnection in environment variables or user-secrets.");

var jwtSecret = RequireConfig(
    builder.Configuration,
    "Jwt:Secret",
    "Set Jwt__Secret in environment variables or user-secrets.");

if (Encoding.UTF8.GetByteCount(jwtSecret) < 32)
{
    throw new InvalidOperationException("Jwt:Secret must be at least 32 bytes long.");
}

var jwtIssuer = RequireConfig(builder.Configuration, "Jwt:Issuer", "Set Jwt__Issuer.");
var jwtAudience = RequireConfig(builder.Configuration, "Jwt:Audience", "Set Jwt__Audience.");
var allowedOrigins = GetAllowedOrigins(builder.Configuration);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure(3)));

builder.Services.AddHttpClient();
builder.Services.AddHttpClient<MlBridgeService>(client =>
    client.Timeout = TimeSpan.FromSeconds(30));

builder.Services.AddScoped<AuditService>();
builder.Services.AddScoped<DecisionSupportService>();
builder.Services.AddScoped<ThreatIntelService>();
builder.Services.AddScoped<RuleEngineService>();
builder.Services.AddScoped<AlertService>();
builder.Services.AddScoped<IncidentService>();
builder.Services.AddScoped<ThreatService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<ExportService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
        opt.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var token = ctx.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token) &&
                    ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                {
                    ctx.Token = token;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddSignalR();

builder.Services.AddCors(opt =>
    opt.AddPolicy("ReactFrontend", policy =>
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("ReactFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<AuditMiddleware>();

app.MapControllers();
app.MapHub<AlertHub>("/hubs/alerts");

app.Run();

static string RequireConfig(IConfiguration config, string key, string hint)
{
    var value = config[key];
    if (string.IsNullOrWhiteSpace(value))
    {
        throw new InvalidOperationException($"Missing configuration '{key}'. {hint}");
    }

    return value;
}

static string[] GetAllowedOrigins(IConfiguration config)
{
    var arrayValues = config.GetSection("AllowedOrigins")
        .GetChildren()
        .Select(c => c.Value)
        .Where(v => !string.IsNullOrWhiteSpace(v))
        .Select(v => v!)
        .ToArray();

    if (arrayValues.Length > 0)
    {
        return arrayValues;
    }

    var raw = config["AllowedOrigins"];
    if (string.IsNullOrWhiteSpace(raw))
    {
        return new[] { "http://localhost:5173" };
    }

    return raw.Split(
        new[] { ',', ';' },
        StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}

