using secureai_backend.Models.Enums;

namespace secureai_backend.DTOs.Alert;

public record AlertDto(
    Guid Id,
    Guid ThreatId,
    string ThreatUrl,
    AlertSeverity Severity,
    string Message,
    bool IsRead,
    DateTime SentAt
);
