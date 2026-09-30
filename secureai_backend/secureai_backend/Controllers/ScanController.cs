using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using secureai_backend.Data;
using secureai_backend.DTOs.ChildSafeNet;
using secureai_backend.DTOs.ML;
using secureai_backend.Models.Entities;
using secureai_backend.Services;

namespace secureai_backend.Controllers;

[Authorize]
[ApiController]
[Route("api/scan")]
public class ScanController(AppDbContext db, MlBridgeService mlBridge) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    public async Task<ActionResult<ScanResult>> Scan([FromBody] ScanRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Url))
        {
            return BadRequest(new { message = "URL is required" });
        }

        var userId = UserId;
        var settings = await GetOrCreateSettingsAsync(userId, ct);
        var host = GetHost(req.Url);
        var whitelist = ParseDomainsJson(settings.WhitelistJson);
        var blacklist = ParseDomainsJson(settings.BlacklistJson);

        if (!string.IsNullOrEmpty(host) && blacklist.Any(domain => DomainMatch(host, domain)))
        {
            var forced = new ScanResult(
                "HIGH",
                "blacklist",
                1.0,
                "BLOCK",
                ["Blocked by blacklist"],
                new Dictionary<string, object> { ["host"] = host, ["source"] = "settings" });

            await SaveScanArtifacts(userId, req, forced, host, ct);
            return Ok(forced);
        }

        if (!string.IsNullOrEmpty(host) && whitelist.Any(domain => DomainMatch(host, domain)))
        {
            var forced = new ScanResult(
                "LOW",
                "whitelist",
                1.0,
                "ALLOW",
                ["Allowed by whitelist"],
                new Dictionary<string, object> { ["host"] = host, ["source"] = "settings" });

            await SaveScanArtifacts(userId, req, forced, host, ct);
            return Ok(forced);
        }

        ScanResult result;
        try
        {
            var ml = await mlBridge.PredictAsync(req.Url);
            result = BuildScanResult(ml, req, host, settings);
        }
        catch (Exception ex)
        {
            result = new ScanResult(
                "MEDIUM",
                "ai_error",
                0.0,
                "WARN",
                ["AI service failed. Fallback to WARN for demo.", ex.Message],
                new Dictionary<string, object> { ["fallback"] = true, ["host"] = host });
        }

        await SaveScanArtifacts(userId, req, result, host, ct);
        return Ok(result);
    }

    private async Task<UserSettings> GetOrCreateSettingsAsync(Guid userId, CancellationToken ct)
    {
        var settings = await db.UserSettings.FirstOrDefaultAsync(x => x.UserId == userId, ct);
        if (settings != null) return settings;

        settings = new UserSettings { UserId = userId, UpdatedAt = DateTime.UtcNow };
        db.UserSettings.Add(settings);
        await db.SaveChangesAsync(ct);
        return settings;
    }

    private static ScanResult BuildScanResult(MlPredictResponse ml, ScanRequest req, string host, UserSettings settings)
    {
        var riskLevel = ml.RiskScore >= 0.85 ? "HIGH" : ml.RiskScore >= 0.45 ? "MEDIUM" : "LOW";
        var action = ml.Action.Equals("block", StringComparison.OrdinalIgnoreCase) || ml.RiskScore >= 0.85
            ? "BLOCK"
            : ml.Action.Equals("alert", StringComparison.OrdinalIgnoreCase) || ml.RiskScore >= 0.60
                ? "WARN"
                : "ALLOW";

        var label = (ml.Label ?? "unknown").ToLowerInvariant();
        if (settings.BlockPhishing && label is "phishing" or "malware" or "defacement")
        {
            action = "BLOCK";
        }

        if (!settings.WarnSuspicious && action == "WARN")
        {
            action = "ALLOW";
        }

        var explanation = new List<string>
        {
            $"Model label: {label}",
            $"Risk score: {ml.RiskScore:P1}",
            $"Benign probability: {ml.BenignProb:P1}",
        };

        if (label != "benign")
        {
            explanation.Add($"SecureAI model detected {label} indicators.");
        }

        if (!string.IsNullOrWhiteSpace(req.Title))
        {
            explanation.Add("Page title was included for analyst context.");
        }

        if (!string.IsNullOrWhiteSpace(req.Text))
        {
            explanation.Add("Page text was included for analyst context.");
        }

        var meta = new Dictionary<string, object>
        {
            ["host"] = host,
            ["source"] = string.IsNullOrWhiteSpace(req.Source) ? "Web" : req.Source!,
            ["probabilities"] = new Dictionary<string, double>
            {
                ["benign"] = ml.BenignProb,
                ["phishing"] = ml.PhishingProb,
                ["malware"] = ml.MalwareProb,
                ["defacement"] = ml.DefacementProb,
            },
            ["top_attention"] = ml.TopAttention.Take(10).Select(x => new Dictionary<string, object>
            {
                ["char"] = x.Char,
                ["weight"] = x.Weight,
            }).ToList(),
        };

        return new ScanResult(riskLevel, label, Math.Round(ml.RiskScore, 4), action, explanation, meta);
    }

    private async Task SaveScanArtifacts(Guid userId, ScanRequest req, ScanResult res, string host, CancellationToken ct)
    {
        db.ScanLogs.Add(new ScanLog
        {
            UserId = userId,
            Url = req.Url.Trim(),
            Title = req.Title,
            Label = res.Label,
            RiskLevel = res.RiskLevel,
            Score = res.Score,
            Action = res.Action,
            ExplanationJson = JsonSerializer.Serialize(res.Explanation),
            Source = string.IsNullOrWhiteSpace(req.Source) ? "Web" : req.Source!,
            CreatedAt = DateTime.UtcNow
        });

        await UpsertDataset(req, res, host, ct);
        await db.SaveChangesAsync(ct);
    }

    private async Task UpsertDataset(ScanRequest req, ScanResult res, string host, CancellationToken ct)
    {
        var url = (req.Url ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(url)) return;

        var existing = await db.UrlDatasets.FirstOrDefaultAsync(x => x.Url == url, ct);
        if (existing == null)
        {
            db.UrlDatasets.Add(new UrlDataset
            {
                Url = url,
                Host = host,
                PredictedLabel = res.Label,
                PredictedScore = res.Score,
                Status = "Pending",
                Source = string.IsNullOrWhiteSpace(req.Source) ? "Web" : req.Source!,
                FirstSeenAt = DateTime.UtcNow,
                LastSeenAt = DateTime.UtcNow,
                SeenCount = 1
            });
            return;
        }

        existing.LastSeenAt = DateTime.UtcNow;
        existing.SeenCount += 1;
        existing.Host = string.IsNullOrWhiteSpace(existing.Host) ? host : existing.Host;
        existing.Source = string.IsNullOrWhiteSpace(req.Source) ? existing.Source : req.Source!;

        if (existing.Status == "Pending")
        {
            existing.PredictedLabel = res.Label;
            existing.PredictedScore = res.Score;
        }
    }

    private static string GetHost(string url)
    {
        try
        {
            var target = url.Contains("://") ? url : "http://" + url;
            return new Uri(target).Host.ToLowerInvariant();
        }
        catch
        {
            return string.Empty;
        }
    }

    private static List<string> ParseDomainsJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json)?.Select(NormalizeDomain).Where(x => x.Length > 0).Distinct().ToList() ?? [];
        }
        catch
        {
            return [];
        }
    }

    private static string NormalizeDomain(string value)
    {
        var domain = (value ?? string.Empty).Trim().ToLowerInvariant();
        if (domain.Contains("://"))
        {
            try { domain = new Uri(domain).Host.ToLowerInvariant(); } catch { }
        }
        domain = domain.Replace("www.", string.Empty);
        return domain.StartsWith('.') ? domain[1..] : domain;
    }

    private static bool DomainMatch(string host, string domain)
    {
        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(domain)) return false;
        host = NormalizeDomain(host);
        domain = NormalizeDomain(domain);
        return host == domain || host.EndsWith("." + domain, StringComparison.OrdinalIgnoreCase);
    }
}