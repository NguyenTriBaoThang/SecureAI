using Microsoft.EntityFrameworkCore;
using secureai_backend.Models.Entities;

namespace secureai_backend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Threat> Threats => Set<Threat>();
    public DbSet<Alert> Alerts => Set<Alert>();
    public DbSet<Incident> Incidents => Set<Incident>();
    public DbSet<AnalystLabel> AnalystLabels => Set<AnalystLabel>();
    public DbSet<User> Users => Set<User>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<RuleConfiguration> RuleConfigurations => Set<RuleConfiguration>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        base.OnModelCreating(mb);

        mb.Entity<Threat>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.Url).IsRequired().HasMaxLength(2048);
            e.Property(t => t.PredictedLabel).HasMaxLength(50);
            e.Property(t => t.TopAttentionJson).HasMaxLength(4000);
            e.Property(t => t.RiskScore).HasColumnType("decimal(5,4)");
            e.Property(t => t.BenignProb).HasColumnType("decimal(5,4)");
            e.Property(t => t.PhishingProb).HasColumnType("decimal(5,4)");
            e.Property(t => t.MalwareProb).HasColumnType("decimal(5,4)");
            e.Property(t => t.DefacementProb).HasColumnType("decimal(5,4)");

            e.HasIndex(t => t.DetectedAt);
            e.HasIndex(t => t.PredictedLabel);
            e.HasIndex(t => t.Status);

            e.HasMany(t => t.Alerts)
             .WithOne(a => a.Threat)
             .HasForeignKey(a => a.ThreatId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(t => t.AnalystLabels)
             .WithOne(l => l.Threat)
             .HasForeignKey(l => l.ThreatId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(t => t.Incidents)
             .WithOne(i => i.Threat)
             .HasForeignKey(i => i.ThreatId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        mb.Entity<Alert>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Message).HasMaxLength(500);
            e.Property(a => a.WorkflowNote).HasMaxLength(1000);
            e.HasIndex(a => a.IsRead);
            e.HasIndex(a => a.Severity);
            e.HasIndex(a => a.Status);
        });

        mb.Entity<Incident>(e =>
        {
            e.HasKey(i => i.Id);
            e.Property(i => i.Title).IsRequired().HasMaxLength(200);
            e.Property(i => i.Summary).HasMaxLength(1000);
            e.Property(i => i.RecommendedAction).HasMaxLength(40);
            e.Property(i => i.DecisionReason).HasMaxLength(1000);
            e.Property(i => i.ResolutionNote).HasMaxLength(1000);
            e.HasIndex(i => i.Status);
            e.HasIndex(i => i.Priority);
            e.HasIndex(i => i.CreatedAt);
            e.HasIndex(i => i.ThreatId).IsUnique();

            e.HasOne(i => i.AssignedTo)
             .WithMany()
             .HasForeignKey(i => i.AssignedToUserId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        mb.Entity<AnalystLabel>(e =>
        {
            e.HasKey(l => l.Id);
            e.Property(l => l.Label).HasMaxLength(50);
            e.Property(l => l.Note).HasMaxLength(1000);
        });

        mb.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.Property(u => u.Email).IsRequired().HasMaxLength(256);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasMaxLength(20);

            e.HasMany(u => u.Labels)
             .WithOne(l => l.Analyst)
             .HasForeignKey(l => l.AnalystId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasMany(u => u.AuditLogs)
             .WithOne(a => a.User)
             .HasForeignKey(a => a.UserId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        mb.Entity<AuditLog>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Action).HasMaxLength(100);
            e.Property(a => a.EntityId).HasMaxLength(100);
            e.Property(a => a.Detail).HasMaxLength(1000);
            e.HasIndex(a => a.Timestamp);
        });

        mb.Entity<RefreshToken>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.Token).IsRequired().HasMaxLength(256);
            e.HasIndex(r => r.Token).IsUnique();
            e.HasOne(r => r.User)
             .WithMany()
             .HasForeignKey(r => r.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });
        mb.Entity<RuleConfiguration>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.BlockThreshold).HasColumnType("float");
            e.Property(r => r.ReviewThreshold).HasColumnType("float");
            e.HasOne(r => r.UpdatedByUser)
             .WithMany()
             .HasForeignKey(r => r.UpdatedByUserId)
             .OnDelete(DeleteBehavior.SetNull);

            e.HasData(new RuleConfiguration
            {
                Id = RuleConfiguration.DefaultId,
                BlockThreshold = 0.85,
                ReviewThreshold = 0.45,
                AutoBlockEnabled = true,
                AutoAlertEnabled = true,
                BlockMaliciousLabels = true,
                UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            });
        });
        mb.Entity<User>().HasData(new User
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Email = "admin@secureai.local",
            PasswordHash = "$2b$12$abcdefghijklmnopqrstuOeKVc0xgqRlBPeC3nbeIZwtICN7jsoWK",
            Role = "Admin",
            IsActive = true,
            CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}

