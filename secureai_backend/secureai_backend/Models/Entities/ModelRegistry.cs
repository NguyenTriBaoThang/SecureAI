using System.ComponentModel.DataAnnotations;

namespace secureai_backend.Models.Entities;

public class ModelRegistry
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Version { get; set; } = string.Empty;

    [MaxLength(64)]
    public string Status { get; set; } = "Active";

    public double? Accuracy { get; set; }
    public double? F1Weighted { get; set; }
    public string MetricsJson { get; set; } = "{}";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}