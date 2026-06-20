namespace secureai_backend.DTOs.ML;

/// <summary>
/// Kết quả trả về từ secureai_ai (Python FastAPI /predict).
/// </summary>
public record MlPredictResponse(
    string Url,
    string Label,           // benign / phishing / malware / defacement
    double RiskScore,
    double BenignProb,
    double PhishingProb,
    double MalwareProb,
    double DefacementProb,
    List<AttentionToken> TopAttention,
    string Action           // allow / alert / block
);
