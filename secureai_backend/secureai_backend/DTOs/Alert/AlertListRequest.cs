using secureai_backend.Models.Enums;

namespace secureai_backend.DTOs.Alert;

public class AlertListRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public AlertSeverity? Severity { get; set; }
    public bool? UnreadOnly { get; set; }
}
