namespace secureai_backend.DTOs.User;

public record UserDto(
    Guid     Id,
    string   Email,
    string   Role,
    bool     IsActive,
    DateTime CreatedAt,
    DateTime? LastLoginAt
);

public record CreateUserRequest(
    string Email,
    string Password,
    string Role
);

public record UpdateUserRequest(
    string? Role,
    bool?   IsActive
);

public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword
);
