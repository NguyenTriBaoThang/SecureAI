using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using secureai_backend.Data;

namespace secureai_backend.Controllers;

[Authorize]
[ApiController]
[Route("api/logs")]
public class LogsController(AppDbContext db) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] string? action,
        [FromQuery] string? label,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.ScanLogs.AsNoTracking().Where(x => x.UserId == UserId);
        if (!string.IsNullOrWhiteSpace(action)) query = query.Where(x => x.Action == action);
        if (!string.IsNullOrWhiteSpace(label)) query = query.Where(x => x.Label == label);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return Ok(new { total, page, pageSize, items });
    }
}