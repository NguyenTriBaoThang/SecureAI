namespace secureai_backend.DTOs.ML;

/// <summary>
/// Internal records dùng để deserialize raw JSON từ Python FastAPI.
/// Không expose ra ngoài controller.
/// </summary>
internal record MlApiRaw(
    string? Url,
    string? Label,
    double RiskScore,
    MlProbs? Probabilities,
    List<MlAttToken>? TopAttention,
    string? Action
);

internal record MlProbs(
    double Benign,
    double Phishing,
    double Malware,
    double Defacement
);

internal record MlAttToken(string Char, double Weight);
