namespace secureai_backend.DTOs.Threat;

public record DecisionSupportDto(
    string Recommendation,
    string Priority,
    string Summary,
    List<string> Reasons,
    List<string> NextSteps
);

public record RiskExplanationDto(
    string ModelScore,
    List<string> ModelSignals,
    List<string> UrlIndicators,
    List<string> AttentionHighlights
);

public record AnalystNoteDto(
    Guid Id,
    string Label,
    string? Note,
    string AnalystEmail,
    DateTime CreatedAt
);
