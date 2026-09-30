using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using secureai_backend.Data;
using secureai_backend.DTOs.ChildSafeNet;

namespace secureai_backend.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/dataset")]
public class DatasetController(AppDbContext db) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("pending")]
    public async Task<ActionResult<List<DatasetItemDto>>> Pending([FromQuery] int take = 50, CancellationToken ct = default)
    {
        var rows = await db.UrlDatasets
            .AsNoTracking()
            .Where(x => x.Status == "Pending")
            .OrderByDescending(x => x.LastSeenAt)
            .Take(Math.Clamp(take, 1, 200))
            .ToListAsync(ct);

        return Ok(rows.Select(ToDto).ToList());
    }

    [HttpPost("approve")]
    public async Task<IActionResult> Approve([FromBody] BulkDatasetRequest req, CancellationToken ct)
    {
        var ids = req.Ids.Distinct().ToList();
        var rows = await db.UrlDatasets.Where(x => ids.Contains(x.Id)).ToListAsync(ct);
        if (rows.Count == 0) return NotFound();

        foreach (var row in rows)
        {
            row.FinalLabel = string.IsNullOrWhiteSpace(row.PredictedLabel) ? "benign" : row.PredictedLabel.ToLowerInvariant();
            row.Status = "Verified";
            row.VerifiedByUserId = UserId;
            row.VerifiedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return Ok(new { ok = true, count = rows.Count });
    }

    [HttpPost("reject")]
    public async Task<IActionResult> Reject([FromBody] BulkDatasetRequest req, CancellationToken ct)
    {
        var ids = req.Ids.Distinct().ToList();
        var rows = await db.UrlDatasets.Where(x => ids.Contains(x.Id)).ToListAsync(ct);
        if (rows.Count == 0) return NotFound();

        foreach (var row in rows)
        {
            row.Status = "Rejected";
        }

        await db.SaveChangesAsync(ct);
        return Ok(new { ok = true, count = rows.Count });
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export([FromQuery] int limit = 500000, CancellationToken ct = default)
    {
        var rows = await db.UrlDatasets
            .AsNoTracking()
            .Where(x => x.Status == "Verified" && x.FinalLabel != null)
            .OrderByDescending(x => x.VerifiedAt)
            .Take(Math.Clamp(limit, 1, 1_000_000))
            .Select(x => new { x.Url, Label = x.FinalLabel! })
            .ToListAsync(ct);

        var sb = new StringBuilder();
        sb.AppendLine("url,label");
        foreach (var row in rows)
        {
            sb.AppendLine($"\"{row.Url.Replace("\"", "\"\"")}\",\"{row.Label.Replace("\"", "\"\"")}\"");
        }

        return File(
            Encoding.UTF8.GetBytes(sb.ToString()),
            "text/csv; charset=utf-8",
            $"secureai_verified_{DateTime.UtcNow:yyyyMMdd_HHmm}.csv");
    }

    private static DatasetItemDto ToDto(Models.Entities.UrlDataset row)
        => new(
            row.Id,
            row.Url,
            row.Host,
            row.PredictedLabel,
            row.PredictedScore,
            InferActionFromLabel(row.PredictedLabel),
            row.Status,
            row.FinalLabel,
            row.SeenCount,
            row.LastSeenAt,
            row.Source);

    private static string InferActionFromLabel(string? label)
    {
        var value = (label ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(value)) return "WARN";
        if (value.Contains("phishing") || value.Contains("malware") || value.Contains("defacement") || value.Contains("blacklist")) return "BLOCK";
        if (value.Contains("suspicious") || value.Contains("unknown") || value.Contains("ai_error")) return "WARN";
        if (value.Contains("benign") || value.Contains("whitelist")) return "ALLOW";
        return "WARN";
    }
}