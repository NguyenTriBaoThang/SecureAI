using System.ComponentModel.DataAnnotations;

namespace secureai_backend.Models.Entities;

public class UrlFeedback
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }

    [MaxLength(2048)]
    public string Url { get; set; } = string.Empty;

    [MaxLength(64)]
    public string FeedbackLabel { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }

    [MaxLength(512)]
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}