using System.ComponentModel.DataAnnotations;

namespace secureai_backend.Models.Entities;

public class UrlDataset
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [MaxLength(2048)]
    public string Url { get; set; } = string.Empty;

    [MaxLength(512)]
    public string Host { get; set; } = string.Empty;

    [MaxLength(64)]
    public string PredictedLabel { get; set; } = string.Empty;

    public double PredictedScore { get; set; }

    [MaxLength(64)]
    public string? FinalLabel { get; set; }

    [MaxLength(16)]
    public string Status { get; set; } = "Pending";

    [MaxLength(32)]
    public string Source { get; set; } = "Web";

    public DateTime FirstSeenAt { get; set; } = DateTime.UtcNow;
    public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;
    public int SeenCount { get; set; } = 1;

    public Guid? VerifiedByUserId { get; set; }
    public DateTime? VerifiedAt { get; set; }

    public User? VerifiedByUser { get; set; }
}