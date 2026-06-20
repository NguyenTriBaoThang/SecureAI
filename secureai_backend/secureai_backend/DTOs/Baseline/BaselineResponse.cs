namespace secureai_backend.DTOs.Baseline;

public record BaselineRequest(string Url);

public record BaselineResponse(
    string Url,
    List<MethodResult> Methods,
    bool Agreement,
    string ConsensusLabel,
    Dictionary<string, string> Summary
);

public record MethodResult(
    string Method,
    string Label,
    double RiskScore,
    double Confidence,
    string Reason,
    double LatencyMs
);
