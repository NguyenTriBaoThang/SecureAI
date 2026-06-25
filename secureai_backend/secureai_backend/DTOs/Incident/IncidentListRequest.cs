using secureai_backend.Models.Enums;

namespace secureai_backend.DTOs.Incident;

public class IncidentListRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public IncidentStatus? Status { get; set; }
    public ThreatSeverity? Priority { get; set; }
    public string? Search { get; set; }
}
