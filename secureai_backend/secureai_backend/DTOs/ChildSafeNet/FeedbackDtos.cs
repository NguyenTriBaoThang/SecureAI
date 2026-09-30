using System.ComponentModel.DataAnnotations;

namespace secureai_backend.DTOs.ChildSafeNet;

public class FeedbackRequest
{
    [Required]
    [MaxLength(2048)]
    public string Url { get; set; } = string.Empty;

    [Required]
    [MaxLength(64)]
    public string FeedbackLabel { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }

    [MaxLength(512)]
    public string? Note { get; set; }
}