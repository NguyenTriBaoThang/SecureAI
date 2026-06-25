using secureai_backend.Models.Enums;

namespace secureai_backend.DTOs.Incident;

public record UpdateIncidentRequest(
    IncidentStatus Status,
    string? ResolutionNote,
    Guid? AssignedToUserId
);
