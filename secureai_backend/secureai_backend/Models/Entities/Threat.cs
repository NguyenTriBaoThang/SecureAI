using secureai_backend.Models.Enums;

namespace secureai_backend.Models.Entities;

public class Threat
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Url { get; set; } = string.Empty;

    // Kết quả từ ML API
    public string PredictedLabel { get; set; } = string.Empty;  // benign / phishing / malware / defacement
    public double RiskScore { get; set; }
    public double BenignProb { get; set; }
    public double PhishingProb { get; set; }
    public double MalwareProb { get; set; }
    public double DefacementProb { get; set; }
    public string TopAttentionJson { get; set; } = "[]";          // JSON attention weights từ BiLSTM

    // Trạng thái xử lý
    public ThreatStatus Status { get; set; } = ThreatStatus.Pending;
    public ThreatSeverity Severity { get; set; } = ThreatSeverity.Low;

    // Audit
    public DateTime DetectedAt { get; set; } = DateTime.UtcNow;
    public string? SubmittedBy { get; set; }

    // Navigation properties
    public ICollection<Alert> Alerts { get; set; } = new List<Alert>();
    public ICollection<AnalystLabel> AnalystLabels { get; set; } = new List<AnalystLabel>();
}
