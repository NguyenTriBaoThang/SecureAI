namespace secureai_backend.DTOs.Dashboard;

public record LabelBreakdownDto(
    int Benign,
    int Phishing,
    int Malware,
    int Defacement
);
