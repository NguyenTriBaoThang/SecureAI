namespace secureai_backend.Models.Entities;

public class AnalystLabel
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ThreatId { get; set; }
    public Guid AnalystId { get; set; }
    public string Label { get; set; } = string.Empty; // confirmed / false_positive / escalated
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Threat Threat { get; set; } = null!;
    public User Analyst { get; set; } = null!;
}
