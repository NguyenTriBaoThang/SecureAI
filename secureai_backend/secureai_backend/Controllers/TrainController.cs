using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using secureai_backend.Data;

namespace secureai_backend.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/train")]
public class TrainController(AppDbContext db) : ControllerBase
{
    [HttpGet("jobs")]
    public async Task<IActionResult> GetJobs(CancellationToken ct)
    {
        var models = await db.ModelRegistries
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(20)
            .Select(x => new
            {
                id = x.Id,
                x.Name,
                x.Version,
                x.Status,
                x.Accuracy,
                x.F1Weighted,
                x.CreatedAt
            })
            .ToListAsync(ct);

        return Ok(models);
    }

    [HttpPost("trigger")]
    public IActionResult TriggerTrain()
    {
        return Ok(new
        {
            jobId = "secureai_train_job_" + DateTime.UtcNow.Ticks,
            status = "Queued",
            message = "Training scheduler is mocked for demo. Export verified dataset from /api/dataset/export and retrain offline."
        });
    }
}