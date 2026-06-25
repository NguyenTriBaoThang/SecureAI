using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using secureai_backend.Data;
using secureai_backend.DTOs.ML;
using secureai_backend.DTOs.RuleEngine;
using secureai_backend.DTOs.Threat;
using secureai_backend.Models.Entities;
using secureai_backend.Models.Enums;

namespace secureai_backend.Services;

public class ThreatService(
    AppDbContext db,
    MlBridgeService mlBridge,
    AlertService alertService,
    IncidentService incidentService,
    DecisionSupportService decisionSupport,
    ThreatIntelService threatIntel,
    RuleEngineService ruleEngine,
    AuditService auditService)
{
    public async Task<ThreatDto> AnalyzeAsync(string url, string? userId)
    {
        var ml = await mlBridge.PredictAsync(url);
        var config = await ruleEngine.GetConfigAsync();
        var enrichment = threatIntel.Analyze(url);
        var ruleEvaluation = ruleEngine.Evaluate(ml.Label, ml.RiskScore, enrichment, config);
        var severity = ResolveSeverity(ml.RiskScore, ruleEvaluation.Action);

        var threat = new Threat
        {
            Url = url,
            PredictedLabel = ml.Label,
            RiskScore = ml.RiskScore,
            BenignProb = ml.BenignProb,
            PhishingProb = ml.PhishingProb,
            MalwareProb = ml.MalwareProb,
            DefacementProb = ml.DefacementProb,
            TopAttentionJson = JsonSerializer.Serialize(ml.TopAttention),
            Severity = severity,
            SubmittedBy = userId
        };

        db.Threats.Add(threat);
        await db.SaveChangesAsync();

        if (ShouldCreateAlert(severity, ruleEvaluation, config))
        {
            var alertSev = severity == ThreatSeverity.Critical
                ? AlertSeverity.Critical
                : AlertSeverity.High;

            await alertService.CreateAsync(
                threat.Id,
                alertSev,
                $"[{ruleEvaluation.Action.ToUpperInvariant()}] {ml.Label.ToUpperInvariant()} - Risk: {ml.RiskScore:P0} - {url}");
        }

        if (severity >= ThreatSeverity.High && threat.PredictedLabel != "benign")
        {
            await incidentService.CreateForThreatAsync(threat, userId);
        }

        if (userId != null)
        {
            await auditService.LogAsync(userId, "ANALYZE_URL", threat.Id.ToString(), url);
        }

        return await GetByIdAsync(threat.Id) ?? ToDto(threat, config, ml.TopAttention);
    }

    public async Task<PagedResult<ThreatDto>> GetListAsync(ThreatListRequest req)
    {
        var config = await ruleEngine.GetConfigAsync();
        var q = db.Threats
            .Include(t => t.AnalystLabels)
            .ThenInclude(l => l.Analyst)
            .Include(t => t.Incidents)
            .AsQueryable();

        if (!string.IsNullOrEmpty(req.Label))
        {
            q = q.Where(t => t.PredictedLabel == req.Label);
        }

        if (req.Status.HasValue)
        {
            q = q.Where(t => t.Status == req.Status.Value);
        }

        if (req.Severity.HasValue)
        {
            q = q.Where(t => t.Severity == req.Severity.Value);
        }

        if (req.From.HasValue)
        {
            q = q.Where(t => t.DetectedAt >= req.From.Value);
        }

        if (req.To.HasValue)
        {
            q = q.Where(t => t.DetectedAt <= req.To.Value);
        }

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(t => t.DetectedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync();

        return new PagedResult<ThreatDto>(items.Select(t => ToDto(t, config)).ToList(), total, req.Page, req.PageSize);
    }

    public async Task<ThreatDto?> GetByIdAsync(Guid id)
    {
        var config = await ruleEngine.GetConfigAsync();
        var threat = await db.Threats
            .Include(t => t.AnalystLabels)
            .ThenInclude(l => l.Analyst)
            .Include(t => t.Incidents)
            .FirstOrDefaultAsync(t => t.Id == id);

        return threat == null ? null : ToDto(threat, config);
    }

    public async Task<ThreatDto> UpdateStatusAsync(Guid id, ThreatStatus status, string userId)
    {
        var threat = await db.Threats.FindAsync(id)
            ?? throw new KeyNotFoundException($"Threat {id} not found");

        threat.Status = status;
        await db.SaveChangesAsync();
        await auditService.LogAsync(userId, "UPDATE_STATUS", id.ToString(), status.ToString());

        return await GetByIdAsync(id) ?? ToDto(threat, await ruleEngine.GetConfigAsync());
    }

    public async Task<ThreatDto> LabelAsync(Guid id, string label, string? note, string userId)
    {
        var threat = await db.Threats.FindAsync(id)
            ?? throw new KeyNotFoundException($"Threat {id} not found");

        db.AnalystLabels.Add(new AnalystLabel
        {
            ThreatId = id,
            AnalystId = Guid.Parse(userId),
            Label = label,
            Note = note
        });

        threat.Status = label switch
        {
            "confirmed" => ThreatStatus.Confirmed,
            "false_positive" => ThreatStatus.FalsePositive,
            "escalated" => ThreatStatus.Escalated,
            _ => threat.Status
        };

        await db.SaveChangesAsync();
        await incidentService.ApplyThreatLabelAsync(id, label, userId, note);
        await auditService.LogAsync(userId, "LABEL_THREAT", id.ToString(), label);

        return await GetByIdAsync(id) ?? ToDto(threat, await ruleEngine.GetConfigAsync());
    }

    public async Task DeleteAsync(Guid id, string userId)
    {
        var threat = await db.Threats.FindAsync(id)
            ?? throw new KeyNotFoundException($"Threat {id} not found");

        threat.Status = ThreatStatus.Archived;
        await db.SaveChangesAsync();
        await auditService.LogAsync(userId, "ARCHIVE_THREAT", id.ToString());
    }

    private ThreatDto ToDto(Threat threat, RuleConfigurationDto config, List<AttentionToken>? attention = null)
    {
        attention ??= ThreatDtoMapper.DeserializeAttention(threat.TopAttentionJson);
        var enrichment = threatIntel.Analyze(threat.Url);
        var ruleEvaluation = ruleEngine.Evaluate(threat, enrichment, config);

        return new ThreatDto(
            threat.Id,
            threat.Url,
            threat.PredictedLabel,
            threat.RiskScore,
            threat.BenignProb,
            threat.PhishingProb,
            threat.MalwareProb,
            threat.DefacementProb,
            attention,
            threat.Status,
            threat.Severity,
            threat.DetectedAt,
            ruleEvaluation,
            enrichment,
            decisionSupport.BuildDecision(threat, attention),
            decisionSupport.BuildRiskExplanation(threat, attention),
            ThreatDtoMapper.MapIncident(threat.Incidents),
            ThreatDtoMapper.MapNotes(threat.AnalystLabels));
    }

    private static ThreatSeverity ResolveSeverity(double riskScore, string ruleAction)
    {
        if (ruleAction == "Block")
        {
            return ThreatSeverity.Critical;
        }

        if (riskScore >= 0.85)
        {
            return ThreatSeverity.Critical;
        }

        if (riskScore >= 0.60 || ruleAction == "Review")
        {
            return ThreatSeverity.High;
        }

        if (riskScore >= 0.30)
        {
            return ThreatSeverity.Medium;
        }

        return ThreatSeverity.Low;
    }

    private static bool ShouldCreateAlert(
        ThreatSeverity severity,
        RuleEvaluationDto ruleEvaluation,
        RuleConfigurationDto config)
        => config.AutoAlertEnabled && (severity >= ThreatSeverity.High || ruleEvaluation.Action == "Block");
}
