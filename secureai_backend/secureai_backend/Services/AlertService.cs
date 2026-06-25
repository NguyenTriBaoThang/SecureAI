using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using secureai_backend.Data;
using secureai_backend.DTOs.Alert;
using secureai_backend.DTOs.Threat;
using secureai_backend.Hubs;
using secureai_backend.Models.Entities;
using secureai_backend.Models.Enums;

namespace secureai_backend.Services;

public class AlertService(AppDbContext db, IHubContext<AlertHub> hub, AuditService auditService)
{
    public async Task<AlertDto> CreateAsync(Guid threatId, AlertSeverity severity, string message)
    {
        var alert = new Alert
        {
            ThreatId = threatId,
            Severity = severity,
            Status = AlertStatus.New,
            Message = message
        };

        db.Alerts.Add(alert);
        await db.SaveChangesAsync();

        var threat = await db.Threats.FindAsync(threatId);
        var dto = ToDto(alert, threat?.Url ?? string.Empty);
        await hub.Clients.All.SendAsync("NewAlert", dto);

        return dto;
    }

    public async Task<PagedResult<AlertDto>> GetListAsync(AlertListRequest req)
    {
        var q = db.Alerts.Include(a => a.Threat).AsQueryable();

        if (req.Severity.HasValue)
        {
            q = q.Where(a => a.Severity == req.Severity.Value);
        }

        if (req.Status.HasValue)
        {
            q = q.Where(a => a.Status == req.Status.Value);
        }

        if (req.UnreadOnly == true)
        {
            q = q.Where(a => !a.IsRead);
        }

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(a => a.SentAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync();

        return new PagedResult<AlertDto>(
            items.Select(a => ToDto(a, a.Threat?.Url ?? string.Empty)).ToList(),
            total, req.Page, req.PageSize);
    }

    public async Task MarkReadAsync(Guid id)
    {
        var alert = await db.Alerts.FindAsync(id)
            ?? throw new KeyNotFoundException($"Alert {id} not found");

        alert.IsRead = true;
        alert.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    public async Task<AlertDto> UpdateStatusAsync(Guid id, AlertStatus status, string? note, string userId)
    {
        var alert = await db.Alerts
            .Include(a => a.Threat)
            .FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new KeyNotFoundException($"Alert {id} not found");

        alert.Status = status;
        alert.WorkflowNote = note;
        alert.UpdatedAt = DateTime.UtcNow;
        alert.IsRead = true;

        if (status == AlertStatus.FalsePositive)
        {
            alert.Threat.Status = ThreatStatus.FalsePositive;
        }
        else if (status == AlertStatus.Resolved)
        {
            alert.Threat.Status = ThreatStatus.Confirmed;
        }
        else if (status == AlertStatus.Investigating)
        {
            alert.Threat.Status = ThreatStatus.Escalated;
        }

        await db.SaveChangesAsync();
        await auditService.LogAsync(userId, "UPDATE_ALERT_STATUS", id.ToString(), status.ToString());

        var dto = ToDto(alert, alert.Threat.Url);
        await hub.Clients.All.SendAsync("AlertUpdated", dto);
        return dto;
    }

    public async Task MarkAllReadAsync()
        => await db.Alerts
            .Where(a => !a.IsRead)
            .ExecuteUpdateAsync(s => s
                .SetProperty(a => a.IsRead, true)
                .SetProperty(a => a.UpdatedAt, DateTime.UtcNow));

    public async Task<int> GetUnreadCountAsync()
        => await db.Alerts.CountAsync(a => !a.IsRead);

    private static AlertDto ToDto(Alert a, string threatUrl)
        => new(a.Id, a.ThreatId, threatUrl, a.Severity, a.Status, a.Message, a.IsRead, a.SentAt, a.UpdatedAt, a.WorkflowNote);
}
