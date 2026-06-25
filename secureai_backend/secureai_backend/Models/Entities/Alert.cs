using secureai_backend.Models.Enums;

namespace secureai_backend.Models.Entities;

public class Alert
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ThreatId { get; set; }
    public AlertSeverity Severity { get; set; }
    public AlertStatus Status { get; set; } = AlertStatus.New;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? WorkflowNote { get; set; }

    public Threat Threat { get; set; } = null!;
}
