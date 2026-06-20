using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using secureai_backend.DTOs.Auth;
using secureai_backend.Services;

namespace secureai_backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService authService) : ControllerBase
{
    /// <summary>Đăng nhập → JWT AccessToken + RefreshToken</summary>
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest req)
    {
        try
        {
            var result = await authService.LoginAsync(req.Email, req.Password);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>Lấy thông tin user đang đăng nhập</summary>
    [HttpGet("me")]
    [Authorize]
    public ActionResult<MeResponse> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var email = User.FindFirstValue(ClaimTypes.Email)!;
        var role = User.FindFirstValue(ClaimTypes.Role)!;

        return Ok(new MeResponse(userId, email, role));
    }
}
