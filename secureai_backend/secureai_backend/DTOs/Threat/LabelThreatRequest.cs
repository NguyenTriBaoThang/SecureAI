namespace secureai_backend.DTOs.Threat;

public record LabelThreatRequest(
    string Label,   // confirmed / false_positive / escalated
    string? Note
);
