using secureai_backend.Models.Enums;

namespace secureai_backend.Models.Entities;

public class Incident
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ThreatId { get; set; }
    public ThreatSeverity Priority { get; set; }
    public IncidentStatus Status { get; set; } = IncidentStatus.Open;
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string RecommendedAction { get; set; } = string.Empty;
    public string DecisionReason { get; set; } = string.Empty;
    public Guid? AssignedToUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
    public string? ResolutionNote { get; set; }

    public Threat Threat { get; set; } = null!;
    public User? AssignedTo { get; set; }
}
