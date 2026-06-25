using Microsoft.EntityFrameworkCore;
using secureai_backend.Data;
using secureai_backend.DTOs.RuleEngine;
using secureai_backend.DTOs.Threat;
using secureai_backend.Models.Entities;

namespace secureai_backend.Services;

public class RuleEngineService(AppDbContext db, AuditService auditService)
{
    private static readonly HashSet<string> MaliciousLabels = new(StringComparer.OrdinalIgnoreCase)
    {
        "phishing", "malware", "defacement"
    };

    public async Task<RuleConfigurationDto> GetConfigAsync()
    {
        var config = await GetOrCreateConfigAsync();
        return ToDto(config);
    }

    public async Task<RuleConfigurationDto> UpdateConfigAsync(UpdateRuleConfigurationRequest req, string adminId)
    {
        var config = await GetOrCreateConfigAsync();

        if (req.BlockThreshold.HasValue)
        {
            config.BlockThreshold = ClampThreshold(req.BlockThreshold.Value);
        }

        if (req.ReviewThreshold.HasValue)
        {
            config.ReviewThreshold = ClampThreshold(req.ReviewThreshold.Value);
        }

        if (config.ReviewThreshold > config.BlockThreshold)
        {
            throw new InvalidOperationException("Ngưỡng review phải nhỏ hơn hoặc bằng ngưỡng block.");
        }

        if (req.AutoBlockEnabled.HasValue)
        {
            config.AutoBlockEnabled = req.AutoBlockEnabled.Value;
        }

        if (req.AutoAlertEnabled.HasValue)
        {
            config.AutoAlertEnabled = req.AutoAlertEnabled.Value;
        }

        if (req.BlockMaliciousLabels.HasValue)
        {
            config.BlockMaliciousLabels = req.BlockMaliciousLabels.Value;
        }

        config.UpdatedAt = DateTime.UtcNow;
        config.UpdatedByUserId = Guid.TryParse(adminId, out var userId) ? userId : null;

        await db.SaveChangesAsync();
        await auditService.LogAsync(adminId, "UPDATE_RULE_CONFIG", config.Id.ToString(),
            $"block={config.BlockThreshold:0.00};review={config.ReviewThreshold:0.00}");

        return await GetConfigAsync();
    }

    public RuleEvaluationDto Evaluate(
        string label,
        double riskScore,
        ThreatIntelEnrichmentDto enrichment,
        RuleConfigurationDto config)
    {
        var rules = new List<string>();

        if (riskScore >= config.BlockThreshold)
        {
            rules.Add($"Risk score >= ngưỡng block ({config.BlockThreshold:P0}).");
        }
        else if (riskScore >= config.ReviewThreshold)
        {
            rules.Add($"Risk score >= ngưỡng review ({config.ReviewThreshold:P0}).");
        }

        if (config.BlockMaliciousLabels && MaliciousLabels.Contains(label) && riskScore >= config.ReviewThreshold)
        {
            rules.Add($"Nhãn ML là {label} và vượt ngưỡng review.");
        }

        if (enrichment.HasSuspiciousTld)
        {
            rules.Add($"TLD .{enrichment.Tld} nằm trong danh sách rủi ro.");
        }

        if (enrichment.IsIpAddress)
        {
            rules.Add("Domain là IP trực tiếp.");
        }

        if (!enrichment.UsesHttps && riskScore >= config.ReviewThreshold)
        {
            rules.Add("Không dùng HTTPS trong khi risk score đang ở vùng review.");
        }

        if (enrichment.SubdomainCount >= 3)
        {
            rules.Add("Số tầng subdomain cao.");
        }

        if (enrichment.UrlLength >= 120)
        {
            rules.Add("URL rất dài, dễ dùng cho che giấu payload.");
        }

        var shouldBlock =
            config.AutoBlockEnabled &&
            (riskScore >= config.BlockThreshold ||
             (config.BlockMaliciousLabels && MaliciousLabels.Contains(label) && riskScore >= config.BlockThreshold - 0.10));

        var shouldReview =
            riskScore >= config.ReviewThreshold ||
            MaliciousLabels.Contains(label) ||
            enrichment.HasSuspiciousTld ||
            enrichment.IsIpAddress ||
            enrichment.SubdomainCount >= 3;

        var action = shouldBlock ? "Block" : shouldReview ? "Review" : "Allow";

        return new RuleEvaluationDto(
            action,
            rules.Count > 0,
            config.BlockThreshold,
            config.ReviewThreshold,
            rules.Distinct().ToList(),
            BuildActions(action),
            DateTime.UtcNow);
    }

    public RuleEvaluationDto Evaluate(
        Threat threat,
        ThreatIntelEnrichmentDto enrichment,
        RuleConfigurationDto config)
        => Evaluate(threat.PredictedLabel, threat.RiskScore, enrichment, config);

    private async Task<RuleConfiguration> GetOrCreateConfigAsync()
    {
        var config = await db.RuleConfigurations
            .Include(r => r.UpdatedByUser)
            .FirstOrDefaultAsync(r => r.Id == RuleConfiguration.DefaultId);

        if (config != null)
        {
            return config;
        }

        config = new RuleConfiguration
        {
            Id = RuleConfiguration.DefaultId,
            BlockThreshold = 0.85,
            ReviewThreshold = 0.45,
            AutoBlockEnabled = true,
            AutoAlertEnabled = true,
            BlockMaliciousLabels = true,
            UpdatedAt = DateTime.UtcNow
        };

        db.RuleConfigurations.Add(config);
        await db.SaveChangesAsync();
        return config;
    }

    private static RuleConfigurationDto ToDto(RuleConfiguration config)
        => new(
            config.Id,
            config.BlockThreshold,
            config.ReviewThreshold,
            config.AutoBlockEnabled,
            config.AutoAlertEnabled,
            config.BlockMaliciousLabels,
            config.UpdatedAt,
            config.UpdatedByUser?.Email);

    private static double ClampThreshold(double value)
        => Math.Clamp(Math.Round(value, 4), 0.0, 1.0);

    private static List<string> BuildActions(string action) => action switch
    {
        "Block" => new List<string>
        {
            "Chặn URL hoặc domain trên gateway/proxy.",
            "Tạo incident và phân công analyst xử lý.",
            "Tìm người dùng đã truy cập URL này trong log."
        },
        "Review" => new List<string>
        {
            "Đưa vào hàng chờ analyst review.",
            "Kiểm tra domain, redirect chain và telemetry liên quan.",
            "Xác nhận threat hoặc đánh dấu false positive."
        },
        _ => new List<string>
        {
            "Cho phép nhưng giữ lại audit record.",
            "Theo dõi nếu URL xuất hiện lặp lại."
        }
    };
}
