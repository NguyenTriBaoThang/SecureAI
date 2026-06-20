using System.Text;
using Microsoft.EntityFrameworkCore;
using secureai_backend.Data;
using secureai_backend.Models.Enums;

namespace secureai_backend.Services;

public class ExportService(AppDbContext db)
{
    // ── Export threats ra CSV ─────────────────────────────────────────────────
    public async Task<byte[]> ExportThreatsCsvAsync(
        string? label = null,
        ThreatStatus? status = null,
        DateTime? from = null,
        DateTime? to = null)
    {
        var q = db.Threats.AsQueryable();

        if (!string.IsNullOrEmpty(label)) q = q.Where(t => t.PredictedLabel == label);
        if (status.HasValue) q = q.Where(t => t.Status == status.Value);
        if (from.HasValue) q = q.Where(t => t.DetectedAt >= from.Value);
        if (to.HasValue) q = q.Where(t => t.DetectedAt <= to.Value);

        var threats = await q.OrderByDescending(t => t.DetectedAt).ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Id,Url,Label,RiskScore,Severity,Status,DetectedAt");

        foreach (var t in threats)
        {
            var url = $"\"{t.Url.Replace("\"", "\"\"")}\"";
            sb.AppendLine($"{t.Id},{url},{t.PredictedLabel},{t.RiskScore:F4},{t.Severity},{t.Status},{t.DetectedAt:yyyy-MM-ddTHH:mm:ssZ}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    // ── Export alerts ra CSV ──────────────────────────────────────────────────
    public async Task<byte[]> ExportAlertsCsvAsync()
    {
        var alerts = await db.Alerts
            .Include(a => a.Threat)
            .OrderByDescending(a => a.SentAt)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Id,ThreatUrl,Severity,Message,IsRead,SentAt");

        foreach (var a in alerts)
        {
            var url = $"\"{(a.Threat?.Url ?? "").Replace("\"", "\"\"")}\"";
            var msg = $"\"{a.Message.Replace("\"", "\"\"")}\"";
            sb.AppendLine($"{a.Id},{url},{a.Severity},{msg},{a.IsRead},{a.SentAt:yyyy-MM-ddTHH:mm:ssZ}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    // ── Statistics summary ────────────────────────────────────────────────────
    public async Task<object> GetStatisticsAsync()
    {
        var totalThreats = await db.Threats.CountAsync();
        var today = DateTime.UtcNow.Date;

        var labelBreakdown = await db.Threats
            .GroupBy(t => t.PredictedLabel)
            .Select(g => new { Label = g.Key, Count = g.Count() })
            .ToListAsync();

        var severityBreakdown = await db.Threats
            .GroupBy(t => t.Severity)
            .Select(g => new { Severity = g.Key, Count = g.Count() })
            .ToListAsync();

        var statusBreakdown = await db.Threats
            .GroupBy(t => t.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        // GroupBy Date — lấy về memory trước, format sau (EF Core không translate ToString)
        var last30DaysRaw = await db.Threats
            .Where(t => t.DetectedAt >= DateTime.UtcNow.AddDays(-30))
            .GroupBy(t => t.DetectedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .OrderBy(g => g.Date)
            .ToListAsync();

        var last30Days = last30DaysRaw
            .Select(g => new { Date = g.Date.ToString("yyyy-MM-dd"), g.Count })
            .ToList();

        // Convert enum về string trong memory
        var severityBreakdownFormatted = severityBreakdown
            .Select(s => new { Severity = s.Severity.ToString(), s.Count }).ToList();

        var statusBreakdownFormatted = statusBreakdown
            .Select(s => new { Status = s.Status.ToString(), s.Count }).ToList();

        var avgRiskScore = totalThreats > 0
            ? await db.Threats.AverageAsync(t => t.RiskScore)
            : 0.0;

        var topMaliciousUrls = await db.Threats
            .Where(t => t.PredictedLabel != "benign")
            .OrderByDescending(t => t.RiskScore)
            .Take(10)
            .Select(t => new { t.Url, t.PredictedLabel, t.RiskScore, t.DetectedAt })
            .ToListAsync();

        return new
        {
            TotalThreats = totalThreats,
            TodayThreats = await db.Threats.CountAsync(t => t.DetectedAt >= today),
            AvgRiskScore = Math.Round(avgRiskScore, 4),
            TotalAlerts = await db.Alerts.CountAsync(),
            UnreadAlerts = await db.Alerts.CountAsync(a => !a.IsRead),
            LabelBreakdown = labelBreakdown,
            SeverityBreakdown = severityBreakdownFormatted,
            StatusBreakdown = statusBreakdownFormatted,
            Last30DaysTrend = last30Days,
            TopMaliciousUrls = topMaliciousUrls,
        };
    }
}