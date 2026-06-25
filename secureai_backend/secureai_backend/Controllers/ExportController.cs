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
    [HttpGet("threats/csv")]
    public async Task<IActionResult> ExportThreatsCsv(
        [FromQuery] string? label = null,
        [FromQuery] ThreatStatus? status = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var bytes = await exportService.ExportThreatsCsvAsync(label, status, from, to);
        return File(bytes, "text/csv; charset=utf-8", $"threats_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    [HttpGet("threats/pdf")]
    public async Task<IActionResult> ExportThreatsPdf(
        [FromQuery] string? label = null,
        [FromQuery] ThreatStatus? status = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var bytes = await exportService.ExportThreatsPdfAsync(label, status, from, to);
        return File(bytes, "application/pdf", $"threats_{DateTime.UtcNow:yyyyMMdd}.pdf");
    }

    [HttpGet("alerts/csv")]
    public async Task<IActionResult> ExportAlertsCsv()
    {
        var bytes = await exportService.ExportAlertsCsvAsync();
        return File(bytes, "text/csv; charset=utf-8", $"alerts_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    [HttpGet("alerts/pdf")]
    public async Task<IActionResult> ExportAlertsPdf()
    {
        var bytes = await exportService.ExportAlertsPdfAsync();
        return File(bytes, "application/pdf", $"alerts_{DateTime.UtcNow:yyyyMMdd}.pdf");
    }

    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics()
        => Ok(await exportService.GetStatisticsAsync());
}
