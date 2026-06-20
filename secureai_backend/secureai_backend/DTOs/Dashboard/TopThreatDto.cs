namespace secureai_backend.DTOs.Dashboard;

public record TopThreatDto(
    Guid Id,
    string Url,
    string Label,
    double RiskScore,
    DateTime DetectedAt
);
