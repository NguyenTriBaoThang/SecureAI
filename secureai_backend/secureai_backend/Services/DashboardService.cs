using Microsoft.EntityFrameworkCore;
using secureai_backend.Data;
using secureai_backend.DTOs.Dashboard;
using secureai_backend.Models.Enums;

namespace secureai_backend.Services;

public class DashboardService(AppDbContext db)
{
    public async Task<DashboardSummaryDto> GetSummaryAsync()
    {
        var today = DateTime.UtcNow.Date;

        var totalThreats = await db.Threats.CountAsync();
        var todayThreats = await db.Threats.CountAsync(t => t.DetectedAt >= today);
        var unreadAlerts = await db.Alerts.CountAsync(a => !a.IsRead);
        var criticalAlerts = await db.Alerts.CountAsync(a => a.Severity == AlertSeverity.Critical && !a.IsRead);
        var pendingReview = await db.Threats.CountAsync(t => t.Status == ThreatStatus.Pending);
        var openIncidents = await db.Incidents.CountAsync(i => i.Status == IncidentStatus.Open || i.Status == IncidentStatus.Investigating);
        var investigatingAlerts = await db.Alerts.CountAsync(a => a.Status == AlertStatus.Investigating);

        var labelGroups = await db.Threats
            .GroupBy(t => t.PredictedLabel)
            .Select(g => new { Label = g.Key, Count = g.Count() })
            .ToListAsync();

        int Get(string label) => labelGroups.FirstOrDefault(x => x.Label == label)?.Count ?? 0;

        return new DashboardSummaryDto(
            totalThreats,
            todayThreats,
            unreadAlerts,
            criticalAlerts,
            pendingReview,
            openIncidents,
            investigatingAlerts,
            new LabelBreakdownDto(Get("benign"), Get("phishing"), Get("malware"), Get("defacement")));
    }

    public async Task<List<TimelinePoint>> GetTimelineAsync(int days)
    {
        var from = DateTime.UtcNow.Date.AddDays(-days + 1);

        var raw = await db.Threats
            .Where(t => t.DetectedAt >= from)
            .GroupBy(t => new { Date = t.DetectedAt.Date, t.PredictedLabel })
            .Select(g => new { g.Key.Date, g.Key.PredictedLabel, Count = g.Count() })
            .ToListAsync();

        return Enumerable.Range(0, days)
            .Select(i =>
            {
                var date = from.AddDays(i);
                int Get(string label) =>
                    raw.FirstOrDefault(d => d.Date == date && d.PredictedLabel == label)?.Count ?? 0;

                return new TimelinePoint(
                    date.ToString("yyyy-MM-dd"),
                    Get("benign"), Get("phishing"), Get("malware"), Get("defacement"));
            })
            .ToList();
    }

    public async Task<List<TopThreatDto>> GetTopThreatsAsync(int count)
        => await db.Threats
            .Where(t => t.PredictedLabel != "benign")
            .OrderByDescending(t => t.RiskScore)
            .Take(count)
            .Select(t => new TopThreatDto(t.Id, t.Url, t.PredictedLabel, t.RiskScore, t.DetectedAt))
            .ToListAsync();
}
