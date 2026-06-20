using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using secureai_backend.DTOs.Alert;
using secureai_backend.DTOs.Threat;
using secureai_backend.Services;

namespace secureai_backend.Controllers;

[ApiController]
[Route("api/alerts")]
[Authorize]
public class AlertController(AlertService alertService) : ControllerBase
{
    /// <summary>Danh sách alerts — filter theo severity / unread</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<AlertDto>>> GetList([FromQuery] AlertListRequest req)
        => Ok(await alertService.GetListAsync(req));

    /// <summary>Số alert chưa đọc — dùng cho badge notification trên React</summary>
    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount()
        => Ok(await alertService.GetUnreadCountAsync());

    /// <summary>Đánh dấu 1 alert đã đọc</summary>
    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        try
        {
            await alertService.MarkReadAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    /// <summary>Đánh dấu tất cả alerts đã đọc</summary>
    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        await alertService.MarkAllReadAsync();
        return NoContent();
    }
}
