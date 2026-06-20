using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using secureai_backend.Models.Enums;
using secureai_backend.Services;

namespace secureai_backend.Controllers;

[ApiController]
[Route("api/export")]
[Authorize]
public class ExportController(ExportService exportService) : ControllerBase
{
    /// <summary>Export threats ra CSV</summary>
    [HttpGet("threats/csv")]
    public async Task<IActionResult> ExportThreatsCsv(
        [FromQuery] string?       label  = null,
        [FromQuery] ThreatStatus? status = null,
        [FromQuery] DateTime?     from   = null,
        [FromQuery] DateTime?     to     = null)
    {
        var bytes = await exportService.ExportThreatsCsvAsync(label, status, from, to);
        return File(bytes, "text/csv", $"threats_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    /// <summary>Export alerts ra CSV</summary>
    [HttpGet("alerts/csv")]
    public async Task<IActionResult> ExportAlertsCsv()
    {
        var bytes = await exportService.ExportAlertsCsvAsync();
        return File(bytes, "text/csv", $"alerts_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    /// <summary>Thống kê tổng hợp</summary>
    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics()
        => Ok(await exportService.GetStatisticsAsync());
}
