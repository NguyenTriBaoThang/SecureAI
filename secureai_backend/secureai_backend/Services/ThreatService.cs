using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using secureai_backend.Data;
using secureai_backend.DTOs.ML;
using secureai_backend.DTOs.Threat;
using secureai_backend.Models.Entities;
using secureai_backend.Models.Enums;

namespace secureai_backend.Services;

public class ThreatService(
    AppDbContext db,
    MlBridgeService mlBridge,
    AlertService alertService,
    AuditService auditService)
{
    // ── 1. Phân tích URL ─────────────────────────────────────────────────────
    public async Task<ThreatDto> AnalyzeAsync(string url, string? userId)
    {
        // Gọi Python ML API
        var ml = await mlBridge.PredictAsync(url);

        // Risk score → severity
        var severity = ml.RiskScore switch
        {
            >= 0.85 => ThreatSeverity.Critical,
            >= 0.60 => ThreatSeverity.High,
            >= 0.30 => ThreatSeverity.Medium,
            _ => ThreatSeverity.Low
        };

        // Lưu threat vào DB
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

        // Tự động tạo alert nếu rủi ro High hoặc Critical
        if (severity >= ThreatSeverity.High)
        {
            var alertSev = severity == ThreatSeverity.Critical
                ? AlertSeverity.Critical
                : AlertSeverity.High;

            await alertService.CreateAsync(
                threat.Id,
                alertSev,
                $"[{ml.Label.ToUpper()}] {url} — Risk: {ml.RiskScore:P0}");
        }

        if (userId != null)
            await auditService.LogAsync(userId, "ANALYZE_URL", threat.Id.ToString(), url);

        return ToDto(threat, ml.TopAttention);
    }

    // ── 2. Danh sách threats (filter + phân trang) ───────────────────────────
    public async Task<PagedResult<ThreatDto>> GetListAsync(ThreatListRequest req)
    {
        var q = db.Threats.AsQueryable();

        if (!string.IsNullOrEmpty(req.Label))
            q = q.Where(t => t.PredictedLabel == req.Label);
        if (req.Status.HasValue)
            q = q.Where(t => t.Status == req.Status.Value);
        if (req.Severity.HasValue)
            q = q.Where(t => t.Severity == req.Severity.Value);
        if (req.From.HasValue)
            q = q.Where(t => t.DetectedAt >= req.From.Value);
        if (req.To.HasValue)
            q = q.Where(t => t.DetectedAt <= req.To.Value);

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(t => t.DetectedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync();

        return new PagedResult<ThreatDto>(
            items.Select(t => ToDto(t)).ToList(),
            total, req.Page, req.PageSize);
    }

    // ── 3. Chi tiết 1 threat ─────────────────────────────────────────────────
    public async Task<ThreatDto?> GetByIdAsync(Guid id)
    {
        var t = await db.Threats.FindAsync(id);
        return t == null ? null : ToDto(t);
    }

    // ── 4. Cập nhật trạng thái ───────────────────────────────────────────────
    public async Task<ThreatDto> UpdateStatusAsync(Guid id, ThreatStatus status, string userId)
    {
        var threat = await db.Threats.FindAsync(id)
            ?? throw new KeyNotFoundException($"Không tìm thấy threat {id}");

        threat.Status = status;
        await db.SaveChangesAsync();
        await auditService.LogAsync(userId, "UPDATE_STATUS", id.ToString(), status.ToString());

        return ToDto(threat);
    }

    // ── 5. Analyst gán nhãn (feedback loop) ─────────────────────────────────
    public async Task<ThreatDto> LabelAsync(Guid id, string label, string? note, string userId)
    {
        var threat = await db.Threats.FindAsync(id)
            ?? throw new KeyNotFoundException($"Không tìm thấy threat {id}");

        db.AnalystLabels.Add(new AnalystLabel
        {
            ThreatId = id,
            AnalystId = Guid.Parse(userId),
            Label = label,
            Note = note
        });

        // Đồng bộ status theo label
        threat.Status = label switch
        {
            "confirmed" => ThreatStatus.Confirmed,
            "false_positive" => ThreatStatus.FalsePositive,
            "escalated" => ThreatStatus.Escalated,
            _ => threat.Status
        };

        await db.SaveChangesAsync();
        await auditService.LogAsync(userId, "LABEL_THREAT", id.ToString(), label);

        return ToDto(threat);
    }

    // ── 6. Archive (soft delete) ─────────────────────────────────────────────
    public async Task DeleteAsync(Guid id, string userId)
    {
        var threat = await db.Threats.FindAsync(id)
            ?? throw new KeyNotFoundException($"Không tìm thấy threat {id}");

        threat.Status = ThreatStatus.Archived;
        await db.SaveChangesAsync();
        await auditService.LogAsync(userId, "ARCHIVE_THREAT", id.ToString());
    }

    // ── Helper: Entity → DTO ─────────────────────────────────────────────────
    private static ThreatDto ToDto(Threat t, List<AttentionToken>? att = null)
    {
        att ??= TryDeserializeAttention(t.TopAttentionJson);
        return new ThreatDto(
            t.Id, t.Url, t.PredictedLabel, t.RiskScore,
            t.BenignProb, t.PhishingProb, t.MalwareProb, t.DefacementProb,
            att, t.Status, t.Severity, t.DetectedAt);
    }

    private static List<AttentionToken> TryDeserializeAttention(string json)
    {
        try { return JsonSerializer.Deserialize<List<AttentionToken>>(json) ?? []; }
        catch { return []; }
    }
}
