using Microsoft.EntityFrameworkCore;
using secureai_backend.Data;
using secureai_backend.DTOs.Incident;
using secureai_backend.DTOs.Threat;
using secureai_backend.Models.Entities;
using secureai_backend.Models.Enums;

namespace secureai_backend.Services;

public class IncidentService(
    AppDbContext db,
    DecisionSupportService decisionSupport,
    AuditService auditService)
{
    public async Task<IncidentDto?> CreateForThreatAsync(Threat threat, string? userId)
    {
        if (threat.Severity < ThreatSeverity.High || threat.PredictedLabel == "benign")
        {
            return null;
        }

        var existing = await db.Incidents
            .Include(i => i.Threat)
            .ThenInclude(t => t.AnalystLabels)
            .ThenInclude(l => l.Analyst)
            .Include(i => i.AssignedTo)
            .FirstOrDefaultAsync(i => i.ThreatId == threat.Id);

        if (existing != null)
        {
            return ToDto(existing);
        }

        var decision = decisionSupport.BuildDecision(threat);
        var incident = new Incident
        {
            ThreatId = threat.Id,
            Priority = threat.Severity,
            Status = IncidentStatus.Open,
            Title = decisionSupport.BuildIncidentTitle(threat),
            Summary = decision.Summary,
            RecommendedAction = decision.Recommendation,
            DecisionReason = decisionSupport.BuildIncidentReason(threat),
            AssignedToUserId = Guid.TryParse(userId, out var analystId) ? analystId : null,
        };

        db.Incidents.Add(incident);
        await db.SaveChangesAsync();

        if (userId != null)
        {
            await auditService.LogAsync(userId, "CREATE_INCIDENT", incident.Id.ToString(), incident.Title);
        }

        await db.Entry(incident).Reference(i => i.Threat).LoadAsync();
        await db.Entry(incident).Reference(i => i.AssignedTo).LoadAsync();
        return ToDto(incident);
    }

    public async Task<PagedResult<IncidentDto>> GetListAsync(IncidentListRequest req)
    {
        var q = db.Incidents
            .Include(i => i.Threat)
            .ThenInclude(t => t.AnalystLabels)
            .ThenInclude(l => l.Analyst)
            .Include(i => i.AssignedTo)
            .AsQueryable();

        if (req.Status.HasValue)
        {
            q = q.Where(i => i.Status == req.Status.Value);
        }

        if (req.Priority.HasValue)
        {
            q = q.Where(i => i.Priority == req.Priority.Value);
        }

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var search = req.Search.Trim();
            q = q.Where(i => i.Title.Contains(search) || i.Threat.Url.Contains(search));
        }

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(i => i.UpdatedAt)
            .ThenByDescending(i => i.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync();

        return new PagedResult<IncidentDto>(items.Select(ToDto).ToList(), total, req.Page, req.PageSize);
    }

    public async Task<IncidentDto?> GetByIdAsync(Guid id)
    {
        var incident = await db.Incidents
            .Include(i => i.Threat)
            .ThenInclude(t => t.AnalystLabels)
            .ThenInclude(l => l.Analyst)
            .Include(i => i.AssignedTo)
            .FirstOrDefaultAsync(i => i.Id == id);

        return incident == null ? null : ToDto(incident);
    }

    public async Task<IncidentDto> UpdateAsync(Guid id, UpdateIncidentRequest req, string userId)
    {
        var incident = await db.Incidents
            .Include(i => i.Threat)
            .ThenInclude(t => t.AnalystLabels)
            .ThenInclude(l => l.Analyst)
            .Include(i => i.AssignedTo)
            .FirstOrDefaultAsync(i => i.Id == id)
            ?? throw new KeyNotFoundException($"Incident {id} not found");

        incident.Status = req.Status;
        incident.UpdatedAt = DateTime.UtcNow;
        incident.ResolutionNote = req.ResolutionNote;

        if (req.AssignedToUserId.HasValue)
        {
            incident.AssignedToUserId = req.AssignedToUserId.Value;
        }
        else if (incident.Status == IncidentStatus.Investigating && Guid.TryParse(userId, out var analystId))
        {
            incident.AssignedToUserId ??= analystId;
        }

        if (incident.Status is IncidentStatus.Resolved or IncidentStatus.FalsePositive)
        {
            incident.ResolvedAt = DateTime.UtcNow;
        }
        else
        {
            incident.ResolvedAt = null;
        }

        if (incident.Status == IncidentStatus.FalsePositive)
        {
            incident.Threat.Status = ThreatStatus.FalsePositive;
        }
        else if (incident.Status == IncidentStatus.Resolved)
        {
            incident.Threat.Status = ThreatStatus.Confirmed;
        }
        else if (incident.Status == IncidentStatus.Investigating)
        {
            incident.Threat.Status = ThreatStatus.Escalated;
        }

        await db.Alerts
            .Where(a => a.ThreatId == incident.ThreatId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(a => a.Status, MapAlertStatus(incident.Status))
                .SetProperty(a => a.IsRead, true)
                .SetProperty(a => a.UpdatedAt, DateTime.UtcNow)
                .SetProperty(a => a.WorkflowNote, req.ResolutionNote));

        await db.SaveChangesAsync();
        await auditService.LogAsync(userId, "UPDATE_INCIDENT", incident.Id.ToString(), incident.Status.ToString());

        await db.Entry(incident).Reference(i => i.AssignedTo).LoadAsync();
        return ToDto(incident);
    }

    public async Task ApplyThreatLabelAsync(Guid threatId, string label, string userId, string? note)
    {
        var incident = await db.Incidents
            .Include(i => i.Threat)
            .FirstOrDefaultAsync(i => i.ThreatId == threatId);

        if (incident == null)
        {
            return;
        }

        incident.UpdatedAt = DateTime.UtcNow;
        incident.ResolutionNote = note;

        switch (label)
        {
            case "confirmed":
                incident.Status = IncidentStatus.Resolved;
                incident.ResolvedAt = DateTime.UtcNow;
                break;
            case "false_positive":
                incident.Status = IncidentStatus.FalsePositive;
                incident.ResolvedAt = DateTime.UtcNow;
                break;
            case "escalated":
                incident.Status = IncidentStatus.Investigating;
                incident.AssignedToUserId ??= Guid.TryParse(userId, out var analystId) ? analystId : null;
                incident.ResolvedAt = null;
                break;
        }

        await db.SaveChangesAsync();
    }

    private IncidentDto ToDto(Incident incident)
    {
        var threat = incident.Threat;
        var attention = ThreatDtoMapper.DeserializeAttention(threat.TopAttentionJson);

        return new IncidentDto(
            incident.Id,
            incident.ThreatId,
            threat.Url,
            threat.PredictedLabel,
            threat.RiskScore,
            incident.Priority,
            incident.Status,
            incident.Title,
            incident.Summary,
            incident.RecommendedAction,
            incident.DecisionReason,
            incident.AssignedToUserId,
            incident.AssignedTo?.Email,
            incident.CreatedAt,
            incident.UpdatedAt,
            incident.ResolvedAt,
            incident.ResolutionNote,
            decisionSupport.BuildDecision(threat, attention),
            decisionSupport.BuildRiskExplanation(threat, attention),
            ThreatDtoMapper.MapNotes(threat.AnalystLabels));
    }

    private static AlertStatus MapAlertStatus(IncidentStatus status) => status switch
    {
        IncidentStatus.Investigating => AlertStatus.Investigating,
        IncidentStatus.Resolved => AlertStatus.Resolved,
        IncidentStatus.FalsePositive => AlertStatus.FalsePositive,
        _ => AlertStatus.New
    };
}
