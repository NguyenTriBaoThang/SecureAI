using secureai_backend.DTOs.Threat;
using secureai_backend.Models.Enums;

namespace secureai_backend.DTOs.Incident;

public record IncidentSummaryDto(
    Guid Id,
    IncidentStatus Status,
    ThreatSeverity Priority,
    string Title,
    string RecommendedAction,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record IncidentDto(
    Guid Id,
    Guid ThreatId,
    string ThreatUrl,
    string PredictedLabel,
    double RiskScore,
    ThreatSeverity Priority,
    IncidentStatus Status,
    string Title,
    string Summary,
    string RecommendedAction,
    string DecisionReason,
    Guid? AssignedToUserId,
    string? AssignedToEmail,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? ResolvedAt,
    string? ResolutionNote,
    DecisionSupportDto DecisionSupport,
    RiskExplanationDto RiskExplanation,
    List<AnalystNoteDto> AnalystNotes
);
