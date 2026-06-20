using secureai_backend.Models.Enums;

namespace secureai_backend.DTOs.Threat;

public class ThreatListRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Label { get; set; }       // benign / phishing / malware / defacement
    public ThreatStatus? Status { get; set; }
    public ThreatSeverity? Severity { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
}
