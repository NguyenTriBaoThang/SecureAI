using System.Security.Claims;
using secureai_backend.Services;

namespace secureai_backend.Middleware;

/// <summary>
/// Tự động ghi AuditLog sau mỗi write request (POST/PATCH/PUT/DELETE) thành công.
/// Không ghi GET để tránh làm đầy bảng AuditLogs.
/// </summary>
public class AuditMiddleware(RequestDelegate next)
{
    private static readonly HashSet<string> _writeMethods =
        new(StringComparer.OrdinalIgnoreCase) { "POST", "PATCH", "PUT", "DELETE" };

    public async Task InvokeAsync(HttpContext ctx, AuditService auditService)
    {
        await next(ctx);

        // Chỉ log write request thành công
        if (!_writeMethods.Contains(ctx.Request.Method)) return;
        if (ctx.Response.StatusCode is < 200 or > 299) return;

        var userId = ctx.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return;

        try
        {
            await auditService.LogAsync(
                userId,
                action: $"{ctx.Request.Method} {ctx.Request.Path}");
        }
        catch
        {
            // Không để audit logging phá vỡ main request
        }
    }
}
