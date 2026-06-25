namespace secureai_backend.Models.Entities;

public class RuleConfiguration
{
    public static readonly Guid DefaultId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    public Guid Id { get; set; } = DefaultId;
    public double BlockThreshold { get; set; } = 0.85;
    public double ReviewThreshold { get; set; } = 0.45;
    public bool AutoBlockEnabled { get; set; } = true;
    public bool AutoAlertEnabled { get; set; } = true;
    public bool BlockMaliciousLabels { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid? UpdatedByUserId { get; set; }
    public User? UpdatedByUser { get; set; }
}
