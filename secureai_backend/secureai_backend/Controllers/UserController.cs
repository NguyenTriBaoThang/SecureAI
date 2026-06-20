using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using secureai_backend.DTOs.User;
using secureai_backend.Services;

namespace secureai_backend.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UserController(UserService userService) : ControllerBase
{
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    /// <summary>Danh sách tất cả users — Admin only</summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<UserDto>>> GetList()
        => Ok(await userService.GetListAsync());

    /// <summary>Chi tiết 1 user</summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> GetById(Guid id)
    {
        var user = await userService.GetByIdAsync(id);
        return user == null ? NotFound() : Ok(user);
    }

    /// <summary>Tạo user mới — Admin only</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserRequest req)
    {
        try
        {
            var result = await userService.CreateAsync(req, UserId);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>Cập nhật role/active — Admin only</summary>
    [HttpPatch("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> Update(Guid id, [FromBody] UpdateUserRequest req)
    {
        try { return Ok(await userService.UpdateAsync(id, req, UserId)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    /// <summary>Đổi mật khẩu — user tự đổi mật khẩu của mình</summary>
    [HttpPatch("{id:guid}/password")]
    public async Task<IActionResult> ChangePassword(Guid id, [FromBody] ChangePasswordRequest req)
    {
        var currentUserId = Guid.Parse(UserId);
        var role          = User.FindFirstValue(ClaimTypes.Role);

        if (currentUserId != id && role != "Admin")
            return Forbid();

        try
        {
            await userService.ChangePasswordAsync(id, req);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
        catch (KeyNotFoundException)           { return NotFound(); }
    }

    /// <summary>Deactivate user — Admin only</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try { await userService.DeleteAsync(id, UserId); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}
