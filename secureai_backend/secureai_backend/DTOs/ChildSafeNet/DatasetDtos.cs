namespace secureai_backend.DTOs.ChildSafeNet;

public record DatasetItemDto(
    Guid Id,
    string Url,
    string Host,
    string PredictedLabel,
    double PredictedScore,
    string Action,
    string Status,
    string? FinalLabel,
    int SeenCount,
    DateTime LastSeenAt,
    string Source
);

public record BulkDatasetRequest(List<Guid> Ids);