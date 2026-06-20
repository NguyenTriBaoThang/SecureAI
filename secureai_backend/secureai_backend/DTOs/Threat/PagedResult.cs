namespace secureai_backend.DTOs.Threat;

public record PagedResult<T>(
    List<T> Items,
    int Total,
    int Page,
    int PageSize
);
