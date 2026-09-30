using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using secureai_backend.Data;
using secureai_backend.DTOs.ChildSafeNet;
using secureai_backend.Models.Entities;

namespace secureai_backend.Controllers;

[Authorize]
[ApiController]
[Route("api/feedback")]
public class FeedbackController(AppDbContext db) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] FeedbackRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Url))
        {
            return BadRequest(new { message = "URL is required" });
        }

        db.UrlFeedbacks.Add(new UrlFeedback
        {
            UserId = UserId,
            Url = req.Url.Trim(),
            FeedbackLabel = req.FeedbackLabel.Trim().ToLowerInvariant(),
            IsCorrect = req.IsCorrect,
            Note = req.Note,
            CreatedAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync(ct);
        return Ok(new { ok = true });
    }
}