using secureai_backend.Models.Enums;

namespace secureai_backend.DTOs.Alert;

public record AlertDto(
    Guid Id,
    Guid ThreatId,
    string ThreatUrl,
    AlertSeverity Severity,
    AlertStatus Status,
    string Message,
    bool IsRead,
    DateTime SentAt,
    DateTime UpdatedAt,
    string? WorkflowNote
);
