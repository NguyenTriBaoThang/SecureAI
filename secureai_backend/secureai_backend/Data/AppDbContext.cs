using Microsoft.EntityFrameworkCore;
using secureai_backend.Models.Entities;
using secureai_backend.Models.Enums;

namespace secureai_backend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Threat> Threats => Set<Threat>();
    public DbSet<Alert> Alerts => Set<Alert>();
    public DbSet<AnalystLabel> AnalystLabels => Set<AnalystLabel>();
    public DbSet<User> Users => Set<User>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        base.OnModelCreating(mb);

        // ── Threat ───────────────────────────────────────────────────────────
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
        });

        // ── Alert ────────────────────────────────────────────────────────────
        mb.Entity<Alert>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Message).HasMaxLength(500);
            e.HasIndex(a => a.IsRead);
            e.HasIndex(a => a.Severity);
        });

        // ── AnalystLabel ─────────────────────────────────────────────────────
        mb.Entity<AnalystLabel>(e =>
        {
            e.HasKey(l => l.Id);
            e.Property(l => l.Label).HasMaxLength(50);
            e.Property(l => l.Note).HasMaxLength(1000);
        });

        // ── User ─────────────────────────────────────────────────────────────
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

        // ── AuditLog ─────────────────────────────────────────────────────────
        mb.Entity<AuditLog>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Action).HasMaxLength(100);
            e.Property(a => a.EntityId).HasMaxLength(100);
            e.Property(a => a.Detail).HasMaxLength(1000);
            e.HasIndex(a => a.Timestamp);
        });

        // ── RefreshToken ──────────────────────────────────────────────────────
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

        // ── Seed: tài khoản Admin mặc định ───────────────────────────────────
        // QUAN TRỌNG: PasswordHash phải là giá trị TĨNH (không gọi BCrypt.HashPassword() ở đây)
        // vì EF Core tính snapshot mỗi lần build — dynamic value gây PendingModelChangesWarning.
        // Hash dưới đây = BCrypt của "Admin@123" với salt cố định.
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
