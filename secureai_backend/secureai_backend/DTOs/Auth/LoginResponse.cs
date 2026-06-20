namespace secureai_backend.DTOs.Auth;

public record LoginResponse(
    string AccessToken,
    string RefreshToken,
    string Role,
    string UserId
);
