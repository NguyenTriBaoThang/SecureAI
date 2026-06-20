namespace secureai_backend.Models.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Viewer";  // Admin / Analyst / Viewer
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    // Navigation
    public ICollection<AnalystLabel> Labels { get; set; } = new List<AnalystLabel>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}
