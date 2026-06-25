using System.Security.Claims;
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
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult<PagedResult<AlertDto>>> GetList([FromQuery] AlertListRequest req)
        => Ok(await alertService.GetListAsync(req));

    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount()
        => Ok(await alertService.GetUnreadCountAsync());

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

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Admin,Analyst")]
    public async Task<ActionResult<AlertDto>> UpdateStatus(Guid id, [FromBody] UpdateAlertStatusRequest req)
    {
        try
        {
            return Ok(await alertService.UpdateStatusAsync(id, req.Status, req.Note, UserId));
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        await alertService.MarkAllReadAsync();
        return NoContent();
    }
}
