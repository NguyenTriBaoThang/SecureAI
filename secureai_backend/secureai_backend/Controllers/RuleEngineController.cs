using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using secureai_backend.DTOs.RuleEngine;
using secureai_backend.Services;

namespace secureai_backend.Controllers;

[ApiController]
[Route("api/rule-engine")]
[Authorize]
public class RuleEngineController(RuleEngineService ruleEngineService) : ControllerBase
{
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet("config")]
    public async Task<ActionResult<RuleConfigurationDto>> GetConfig()
        => Ok(await ruleEngineService.GetConfigAsync());

    [HttpPatch("config")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<RuleConfigurationDto>> UpdateConfig(
        [FromBody] UpdateRuleConfigurationRequest req)
    {
        try
        {
            return Ok(await ruleEngineService.UpdateConfigAsync(req, UserId));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
