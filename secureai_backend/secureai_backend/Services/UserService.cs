using Microsoft.EntityFrameworkCore;
using secureai_backend.Data;
using secureai_backend.DTOs.User;
using secureai_backend.Models.Entities;

namespace secureai_backend.Services;

public class UserService(AppDbContext db, AuditService auditService)
{
    // ── Danh sách users ───────────────────────────────────────────────────────
    public async Task<List<UserDto>> GetListAsync()
        => await db.Users
            .OrderBy(u => u.CreatedAt)
            .Select(u => ToDto(u))
            .ToListAsync();

    // ── Chi tiết 1 user ───────────────────────────────────────────────────────
    public async Task<UserDto?> GetByIdAsync(Guid id)
    {
        var u = await db.Users.FindAsync(id);
        return u == null ? null : ToDto(u);
    }

    // ── Tạo user mới ─────────────────────────────────────────────────────────
    public async Task<UserDto> CreateAsync(CreateUserRequest req, string adminId)
    {
        if (await db.Users.AnyAsync(u => u.Email == req.Email))
            throw new InvalidOperationException($"Email {req.Email} đã tồn tại");

        var user = new User
        {
            Email        = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role         = req.Role,
            IsActive     = true,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
        await auditService.LogAsync(adminId, "CREATE_USER", user.Id.ToString(), req.Email);

        return ToDto(user);
    }

    // ── Cập nhật role / active ────────────────────────────────────────────────
    public async Task<UserDto> UpdateAsync(Guid id, UpdateUserRequest req, string adminId)
    {
        var user = await db.Users.FindAsync(id)
            ?? throw new KeyNotFoundException($"User {id} không tồn tại");

        if (req.Role     != null) user.Role     = req.Role;
        if (req.IsActive != null) user.IsActive = req.IsActive.Value;

        await db.SaveChangesAsync();
        await auditService.LogAsync(adminId, "UPDATE_USER", id.ToString());

        return ToDto(user);
    }

    // ── Đổi mật khẩu ─────────────────────────────────────────────────────────
    public async Task ChangePasswordAsync(Guid id, ChangePasswordRequest req)
    {
        var user = await db.Users.FindAsync(id)
            ?? throw new KeyNotFoundException($"User {id} không tồn tại");

        if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.PasswordHash))
            throw new UnauthorizedAccessException("Mật khẩu hiện tại không đúng");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        await db.SaveChangesAsync();
    }

    // ── Xóa user ─────────────────────────────────────────────────────────────
    public async Task DeleteAsync(Guid id, string adminId)
    {
        var user = await db.Users.FindAsync(id)
            ?? throw new KeyNotFoundException($"User {id} không tồn tại");

        user.IsActive = false;
        await db.SaveChangesAsync();
        await auditService.LogAsync(adminId, "DEACTIVATE_USER", id.ToString());
    }

    private static UserDto ToDto(User u) => new(
        u.Id, u.Email, u.Role, u.IsActive, u.CreatedAt, u.LastLoginAt);
}
