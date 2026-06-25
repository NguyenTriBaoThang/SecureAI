using secureai_backend.DTOs.Incident;
using secureai_backend.DTOs.ML;
using secureai_backend.DTOs.RuleEngine;
using secureai_backend.Models.Enums;

namespace secureai_backend.DTOs.Threat;

public record ThreatDto(
    Guid Id,
    string Url,
    string PredictedLabel,
    double RiskScore,
    double BenignProb,
    double PhishingProb,
    double MalwareProb,
    double DefacementProb,
    List<AttentionToken> TopAttention,
    ThreatStatus Status,
    ThreatSeverity Severity,
    DateTime DetectedAt,
    RuleEvaluationDto RuleEvaluation,
    ThreatIntelEnrichmentDto Enrichment,
    DecisionSupportDto DecisionSupport,
    RiskExplanationDto RiskExplanation,
    IncidentSummaryDto? Incident,
    List<AnalystNoteDto> AnalystNotes
);

