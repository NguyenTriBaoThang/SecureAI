using secureai_backend.Models.Enums;

namespace secureai_backend.DTOs.Alert;

public record UpdateAlertStatusRequest(AlertStatus Status, string? Note);
