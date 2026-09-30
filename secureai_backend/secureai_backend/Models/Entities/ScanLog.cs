using System.ComponentModel.DataAnnotations;

namespace secureai_backend.Models.Entities;

public class ScanLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }

    [MaxLength(2048)]
    public string Url { get; set; } = string.Empty;

    [MaxLength(512)]
    public string? Title { get; set; }

    [MaxLength(64)]
    public string Label { get; set; } = string.Empty;

    [MaxLength(16)]
    public string RiskLevel { get; set; } = string.Empty;

    public double Score { get; set; }

    [MaxLength(16)]
    public string Action { get; set; } = "WARN";

    public string ExplanationJson { get; set; } = "[]";

    [MaxLength(32)]
    public string Source { get; set; } = "Web";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}