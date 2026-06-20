using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using secureai_backend.Data;
using secureai_backend.DTOs.Alert;
using secureai_backend.DTOs.Threat;
using secureai_backend.Hubs;
using secureai_backend.Models.Entities;
using secureai_backend.Models.Enums;

namespace secureai_backend.Services;

public class AlertService(AppDbContext db, IHubContext<AlertHub> hub)
{
    // ── Tạo alert mới + push realtime qua SignalR ────────────────────────────
    public async Task<AlertDto> CreateAsync(
        Guid threatId,
        AlertSeverity severity,
        string message)
    {
        var alert = new Alert
        {
            ThreatId = threatId,
            Severity = severity,
            Message = message
        };

        db.Alerts.Add(alert);
        await db.SaveChangesAsync();

        var threat = await db.Threats.FindAsync(threatId);
        var dto = ToDto(alert, threat?.Url ?? string.Empty);

        // Push realtime → tất cả React client đang kết nối
        await hub.Clients.All.SendAsync("NewAlert", dto);

        return dto;
    }

    // ── Danh sách alerts có filter ───────────────────────────────────────────
    public async Task<PagedResult<AlertDto>> GetListAsync(AlertListRequest req)
    {
        var q = db.Alerts.Include(a => a.Threat).AsQueryable();

        if (req.Severity.HasValue)
            q = q.Where(a => a.Severity == req.Severity.Value);

        if (req.UnreadOnly == true)
            q = q.Where(a => !a.IsRead);

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

    // ── Đánh dấu 1 alert đã đọc ─────────────────────────────────────────────
    public async Task MarkReadAsync(Guid id)
    {
        var alert = await db.Alerts.FindAsync(id)
            ?? throw new KeyNotFoundException($"Alert {id} không tồn tại");

        alert.IsRead = true;
        await db.SaveChangesAsync();
    }

    // ── Đánh dấu tất cả đã đọc ──────────────────────────────────────────────
    public async Task MarkAllReadAsync()
        => await db.Alerts
            .Where(a => !a.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.IsRead, true));

    // ── Số alert chưa đọc (cho badge notification) ───────────────────────────
    public async Task<int> GetUnreadCountAsync()
        => await db.Alerts.CountAsync(a => !a.IsRead);

    // ── Helper ───────────────────────────────────────────────────────────────
    private static AlertDto ToDto(Alert a, string threatUrl)
        => new(a.Id, a.ThreatId, threatUrl, a.Severity, a.Message, a.IsRead, a.SentAt);
}
