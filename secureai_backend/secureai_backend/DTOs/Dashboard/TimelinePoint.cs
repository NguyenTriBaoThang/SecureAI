namespace secureai_backend.DTOs.Dashboard;

/// <summary>
/// 1 điểm dữ liệu trên biểu đồ timeline (Recharts LineChart).
/// </summary>
public record TimelinePoint(
    string Date,        // "yyyy-MM-dd"
    int Benign,
    int Phishing,
    int Malware,
    int Defacement
);
