using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using secureai_backend.Data;
using secureai_backend.Hubs;
using secureai_backend.Middleware;
using secureai_backend.Services;

var builder = WebApplication.CreateBuilder(args);

// ── 1. SQL Server ─────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sql => sql.EnableRetryOnFailure(3)));

// ── 2. Services ───────────────────────────────────────────────────────────────
builder.Services.AddHttpClient();
builder.Services.AddHttpClient<MlBridgeService>(client =>
    client.Timeout = TimeSpan.FromSeconds(30));

builder.Services.AddScoped<AuditService>();
builder.Services.AddScoped<MlBridgeService>();
builder.Services.AddScoped<AlertService>();
builder.Services.AddScoped<ThreatService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<ExportService>();

// ── 3. JWT Authentication ─────────────────────────────────────────────────────
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!))
        };
        opt.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var token = ctx.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token) &&
                    ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                    ctx.Token = token;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ── 4. SignalR ────────────────────────────────────────────────────────────────
builder.Services.AddSignalR();

// ── 5. CORS ───────────────────────────────────────────────────────────────────
builder.Services.AddCors(opt =>
    opt.AddPolicy("ReactFrontend", policy =>
        policy
            .WithOrigins(
                builder.Configuration["AllowedOrigins"] ?? "http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()));

// ── 6. Controllers + OpenAPI .NET 10 built-in ─────────────────────────────────
builder.Services.AddControllers();
//builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ─────────────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Auto-migrate ──────────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

// ── Middleware ────────────────────────────────────────────────────────────────
/*
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
*/
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