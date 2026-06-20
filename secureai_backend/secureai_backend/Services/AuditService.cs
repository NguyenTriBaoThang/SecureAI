using secureai_backend.Data;
using secureai_backend.Models.Entities;

namespace secureai_backend.Services;

/// <summary>
/// Ghi lại mọi hành động của user vào bảng AuditLogs.
/// </summary>
public class AuditService(AppDbContext db)
{
    public async Task LogAsync(
        string userId,
        string action,
        string? entityId = null,
        string? detail = null)
    {
        db.AuditLogs.Add(new AuditLog
        {
            UserId = Guid.Parse(userId),
            Action = action,
            EntityId = entityId,
            Detail = detail
        });

        await db.SaveChangesAsync();
    }
}
