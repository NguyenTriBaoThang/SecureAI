using secureai_backend.Models.Enums;

namespace secureai_backend.Models.Entities;

public class Alert
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ThreatId { get; set; }
    public AlertSeverity Severity { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Threat Threat { get; set; } = null!;
}
