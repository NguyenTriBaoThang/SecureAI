using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using secureai_backend.DTOs.Incident;
using secureai_backend.DTOs.Threat;
using secureai_backend.Services;

namespace secureai_backend.Controllers;

[ApiController]
[Route("api/incidents")]
[Authorize]
public class IncidentController(IncidentService incidentService) : ControllerBase
{
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult<PagedResult<IncidentDto>>> GetList([FromQuery] IncidentListRequest req)
        => Ok(await incidentService.GetListAsync(req));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<IncidentDto>> GetById(Guid id)
    {
        var incident = await incidentService.GetByIdAsync(id);
        return incident == null ? NotFound() : Ok(incident);
    }

    [HttpPatch("{id:guid}")]
    [Authorize(Roles = "Admin,Analyst")]
    public async Task<ActionResult<IncidentDto>> Update(Guid id, [FromBody] UpdateIncidentRequest req)
    {
        try
        {
            return Ok(await incidentService.UpdateAsync(id, req, UserId));
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}
