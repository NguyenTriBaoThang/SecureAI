using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using secureai_backend.DTOs.Threat;
using secureai_backend.Models.Enums;
using secureai_backend.Services;

namespace secureai_backend.Controllers;

[ApiController]
[Route("api/threats")]
[Authorize]
public class ThreatController(ThreatService threatService) : ControllerBase
{
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    /// <summary>Gửi URL để ML phân tích — trả về kết quả BiLSTM+Attention</summary>
    [HttpPost("analyze")]
    [Authorize(Roles = "Admin,Analyst")]
    public async Task<ActionResult<ThreatDto>> Analyze([FromBody] AnalyzeThreatRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Url))
            return BadRequest(new { message = "URL không được để trống" });

        try
        {
            var result = await threatService.AnalyzeAsync(req.Url, UserId);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            // ML API down hoặc lỗi
            return StatusCode(502, new { message = ex.Message });
        }
    }

    /// <summary>Danh sách threats — filter theo label/status/severity + phân trang</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<ThreatDto>>> GetList([FromQuery] ThreatListRequest req)
        => Ok(await threatService.GetListAsync(req));

    /// <summary>Chi tiết 1 threat kèm attention weights</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ThreatDto>> GetById(Guid id)
    {
        var threat = await threatService.GetByIdAsync(id);
        return threat == null ? NotFound() : Ok(threat);
    }

    /// <summary>Cập nhật trạng thái threat</summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Admin,Analyst")]
    public async Task<ActionResult<ThreatDto>> UpdateStatus(
        Guid id, [FromBody] UpdateStatusRequest req)
    {
        try
        {
            var result = await threatService.UpdateStatusAsync(id, req.Status, UserId);
            return Ok(result);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    /// <summary>Analyst gán nhãn + ghi chú — dữ liệu cho feedback loop model</summary>
    [HttpPost("{id:guid}/label")]
    [Authorize(Roles = "Admin,Analyst")]
    public async Task<ActionResult<ThreatDto>> Label(
        Guid id, [FromBody] LabelThreatRequest req)
    {
        try
        {
            var result = await threatService.LabelAsync(id, req.Label, req.Note, UserId);
            return Ok(result);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    /// <summary>Archive threat (soft delete) — chỉ Admin</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await threatService.DeleteAsync(id, UserId);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}
