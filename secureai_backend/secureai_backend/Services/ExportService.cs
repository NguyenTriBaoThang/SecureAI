using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using secureai_backend.Data;
using secureai_backend.DTOs.RuleEngine;
using secureai_backend.Models.Entities;
using secureai_backend.Models.Enums;

namespace secureai_backend.Services;

public class ExportService(
    AppDbContext db,
    ThreatIntelService threatIntel,
    RuleEngineService ruleEngine)
{
    public async Task<byte[]> ExportThreatsCsvAsync(
        string? label = null,
        ThreatStatus? status = null,
        DateTime? from = null,
        DateTime? to = null)
    {
        var config = await ruleEngine.GetConfigAsync();
        var threats = await QueryThreats(label, status, from, to).ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Id,Url,Label,RiskScore,Severity,Status,RuleAction,Domain,TLD,HTTPS,Subdomains,UrlLength,DetectedAt");

        foreach (var t in threats)
        {
            var enrichment = threatIntel.Analyze(t.Url);
            var rule = ruleEngine.Evaluate(t, enrichment, config);
            sb.AppendLine(string.Join(',', new[]
            {
                Csv(t.Id.ToString()),
                Csv(t.Url),
                Csv(t.PredictedLabel),
                Csv(t.RiskScore.ToString("F4", CultureInfo.InvariantCulture)),
                Csv(t.Severity.ToString()),
                Csv(t.Status.ToString()),
                Csv(rule.Action),
                Csv(enrichment.Domain),
                Csv(enrichment.Tld),
                Csv(enrichment.UsesHttps ? "yes" : "no"),
                Csv(enrichment.SubdomainCount.ToString(CultureInfo.InvariantCulture)),
                Csv(enrichment.UrlLength.ToString(CultureInfo.InvariantCulture)),
                Csv(t.DetectedAt.ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture))
            }));
        }

        return new UTF8Encoding(encoderShouldEmitUTF8Identifier: true).GetBytes(sb.ToString());
    }

    public async Task<byte[]> ExportAlertsCsvAsync()
    {
        var alerts = await db.Alerts
            .Include(a => a.Threat)
            .OrderByDescending(a => a.SentAt)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Id,ThreatUrl,Severity,Status,Message,IsRead,SentAt,UpdatedAt");

        foreach (var a in alerts)
        {
            sb.AppendLine(string.Join(',', new[]
            {
                Csv(a.Id.ToString()),
                Csv(a.Threat?.Url ?? string.Empty),
                Csv(a.Severity.ToString()),
                Csv(a.Status.ToString()),
                Csv(a.Message),
                Csv(a.IsRead ? "yes" : "no"),
                Csv(a.SentAt.ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture)),
                Csv(a.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture))
            }));
        }

        return new UTF8Encoding(encoderShouldEmitUTF8Identifier: true).GetBytes(sb.ToString());
    }

    public async Task<byte[]> ExportThreatsPdfAsync(
        string? label = null,
        ThreatStatus? status = null,
        DateTime? from = null,
        DateTime? to = null)
    {
        var config = await ruleEngine.GetConfigAsync();
        var threats = await QueryThreats(label, status, from, to)
            .Take(40)
            .ToListAsync();

        var lines = new List<string>
        {
            $"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC",
            $"Block threshold: {config.BlockThreshold:P0} | Review threshold: {config.ReviewThreshold:P0}",
            $"Total rows included: {threats.Count}",
            string.Empty
        };

        lines.AddRange(threats.Select(t =>
        {
            var enrichment = threatIntel.Analyze(t.Url);
            var rule = ruleEngine.Evaluate(t, enrichment, config);
            return $"{t.DetectedAt:yyyy-MM-dd} | {t.PredictedLabel} | {t.RiskScore:P0} | {rule.Action} | {enrichment.Domain}";
        }));

        return BuildSimplePdf("SecureAI Threat Report", lines);
    }

    public async Task<byte[]> ExportAlertsPdfAsync()
    {
        var alerts = await db.Alerts
            .Include(a => a.Threat)
            .OrderByDescending(a => a.SentAt)
            .Take(40)
            .ToListAsync();

        var lines = new List<string>
        {
            $"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC",
            $"Total rows included: {alerts.Count}",
            string.Empty
        };

        lines.AddRange(alerts.Select(a =>
            $"{a.SentAt:yyyy-MM-dd} | {a.Severity} | {a.Status} | {Trim(a.Threat?.Url ?? a.Message, 78)}"));

        return BuildSimplePdf("SecureAI Alert Report", lines);
    }

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

        var last30DaysRaw = await db.Threats
            .Where(t => t.DetectedAt >= DateTime.UtcNow.AddDays(-30))
            .GroupBy(t => t.DetectedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .OrderBy(g => g.Date)
            .ToListAsync();

        var last30Days = last30DaysRaw
            .Select(g => new { Date = g.Date.ToString("yyyy-MM-dd"), g.Count })
            .ToList();

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
            CriticalAlerts = await db.Alerts.CountAsync(a => a.Severity == AlertSeverity.Critical),
            LabelBreakdown = labelBreakdown,
            SeverityBreakdown = severityBreakdown.Select(s => new { Severity = s.Severity.ToString(), s.Count }).ToList(),
            StatusBreakdown = statusBreakdown.Select(s => new { Status = s.Status.ToString(), s.Count }).ToList(),
            Last30DaysTrend = last30Days,
            TopMaliciousUrls = topMaliciousUrls,
        };
    }

    private IQueryable<Threat> QueryThreats(string? label, ThreatStatus? status, DateTime? from, DateTime? to)
    {
        var q = db.Threats.AsQueryable();

        if (!string.IsNullOrEmpty(label)) q = q.Where(t => t.PredictedLabel == label);
        if (status.HasValue) q = q.Where(t => t.Status == status.Value);
        if (from.HasValue) q = q.Where(t => t.DetectedAt >= from.Value);
        if (to.HasValue) q = q.Where(t => t.DetectedAt <= to.Value);

        return q.OrderByDescending(t => t.DetectedAt);
    }

    private static string Csv(string value)
        => $"\"{value.Replace("\"", "\"\"")}\"";

    private static byte[] BuildSimplePdf(string title, IEnumerable<string> lines)
    {
        var content = new StringBuilder();
        content.AppendLine("BT");
        content.AppendLine("/F1 18 Tf");
        content.AppendLine("50 790 Td");
        content.AppendLine($"({PdfText(title)}) Tj");
        content.AppendLine("/F1 10 Tf");
        content.AppendLine("0 -24 Td");

        foreach (var line in lines.Take(48))
        {
            content.AppendLine($"({PdfText(line)}) Tj");
            content.AppendLine("0 -14 Td");
        }

        content.AppendLine("ET");
        var stream = content.ToString();
        var objects = new List<string>
        {
            "<< /Type /Catalog /Pages 2 0 R >>",
            "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
            $"<< /Length {Encoding.ASCII.GetByteCount(stream)} >>\nstream\n{stream}endstream"
        };

        var pdf = new StringBuilder("%PDF-1.4\n");
        var offsets = new List<int> { 0 };

        for (var i = 0; i < objects.Count; i++)
        {
            offsets.Add(Encoding.ASCII.GetByteCount(pdf.ToString()));
            pdf.AppendLine($"{i + 1} 0 obj");
            pdf.AppendLine(objects[i]);
            pdf.AppendLine("endobj");
        }

        var xrefOffset = Encoding.ASCII.GetByteCount(pdf.ToString());
        pdf.AppendLine("xref");
        pdf.AppendLine($"0 {objects.Count + 1}");
        pdf.AppendLine("0000000000 65535 f ");
        foreach (var offset in offsets.Skip(1))
        {
            pdf.AppendLine($"{offset:0000000000} 00000 n ");
        }

        pdf.AppendLine("trailer");
        pdf.AppendLine($"<< /Size {objects.Count + 1} /Root 1 0 R >>");
        pdf.AppendLine("startxref");
        pdf.AppendLine(xrefOffset.ToString(CultureInfo.InvariantCulture));
        pdf.AppendLine("%%EOF");

        return Encoding.ASCII.GetBytes(pdf.ToString());
    }

    private static string PdfText(string value)
    {
        var ascii = new string(value.Select(c => c is >= ' ' and <= '~' ? c : '?').ToArray());
        return ascii.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)");
    }

    private static string Trim(string value, int max)
        => value.Length <= max ? value : value[..max] + "...";
}
