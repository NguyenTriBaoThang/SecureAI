namespace secureai_backend.DTOs.RuleEngine;

public record RuleConfigurationDto(
    Guid Id,
    double BlockThreshold,
    double ReviewThreshold,
    bool AutoBlockEnabled,
    bool AutoAlertEnabled,
    bool BlockMaliciousLabels,
    DateTime UpdatedAt,
    string? UpdatedByEmail
);

public record UpdateRuleConfigurationRequest(
    double? BlockThreshold,
    double? ReviewThreshold,
    bool? AutoBlockEnabled,
    bool? AutoAlertEnabled,
    bool? BlockMaliciousLabels
);

public record RuleEvaluationDto(
    string Action,
    bool Matched,
    double BlockThreshold,
    double ReviewThreshold,
    List<string> TriggeredRules,
    List<string> RecommendedActions,
    DateTime EvaluatedAt
);
