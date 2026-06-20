using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using secureai_backend.DTOs.Dashboard;
using secureai_backend.Services;

namespace secureai_backend.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController(DashboardService dashboardService) : ControllerBase
{
    /// <summary>Tổng quan: StatCards — tổng threats, alerts chưa đọc, pending review</summary>
    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryDto>> GetSummary()
        => Ok(await dashboardService.GetSummaryAsync());

    /// <summary>Dữ liệu biểu đồ timeline — mặc định 7 ngày, tối đa 90 ngày</summary>
    [HttpGet("timeline")]
    public async Task<ActionResult<List<TimelinePoint>>> GetTimeline([FromQuery] int days = 7)
        => Ok(await dashboardService.GetTimelineAsync(Math.Clamp(days, 1, 90)));

    /// <summary>Top threats rủi ro cao nhất — dùng cho bảng trên Dashboard</summary>
    [HttpGet("top-threats")]
    public async Task<ActionResult<List<TopThreatDto>>> GetTopThreats([FromQuery] int count = 10)
        => Ok(await dashboardService.GetTopThreatsAsync(Math.Clamp(count, 1, 50)));
}
