using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using secureai_backend.Data;
using secureai_backend.DTOs.ChildSafeNet;
using secureai_backend.Models.Entities;

namespace secureai_backend.Controllers;

[Authorize]
[ApiController]
[Route("api/settings")]
public class SettingsController(AppDbContext db) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<SettingsResponse>> Get(CancellationToken ct)
    {
        var settings = await GetOrCreateAsync(UserId, ct);
        return Ok(ToResponse(settings));
    }

    [HttpPut]
    public async Task<ActionResult<SettingsResponse>> Update([FromBody] UpdateSettingsRequest req, CancellationToken ct)
    {
        var settings = await GetOrCreateAsync(UserId, ct);

        var mode = (req.Mode ?? "Balanced").Trim();
        if (mode is not ("Strict" or "Balanced" or "Relaxed"))
        {
            mode = "Balanced";
        }

        settings.ChildAge = Math.Clamp(req.ChildAge, 1, 18);
        settings.Mode = mode;
        settings.WhitelistJson = JsonSerializer.Serialize(CleanDomains(req.Whitelist));
        settings.BlacklistJson = JsonSerializer.Serialize(CleanDomains(req.Blacklist));
        settings.BlockAdult = req.BlockAdult;
        settings.BlockGambling = req.BlockGambling;
        settings.BlockPhishing = req.BlockPhishing;
        settings.WarnSuspicious = req.WarnSuspicious;
        settings.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return Ok(ToResponse(settings));
    }

    private async Task<UserSettings> GetOrCreateAsync(Guid userId, CancellationToken ct)
    {
        var settings = await db.UserSettings.FirstOrDefaultAsync(x => x.UserId == userId, ct);
        if (settings != null)
        {
            return settings;
        }

        settings = new UserSettings
        {
            UserId = userId,
            ChildAge = 10,
            Mode = "Balanced",
            WhitelistJson = "[]",
            BlacklistJson = "[]",
            BlockAdult = true,
            BlockGambling = true,
            BlockPhishing = true,
            WarnSuspicious = true,
            UpdatedAt = DateTime.UtcNow
        };

        db.UserSettings.Add(settings);
        await db.SaveChangesAsync(ct);
        return settings;
    }

    private static SettingsResponse ToResponse(UserSettings settings)
    {
        return new SettingsResponse(
            settings.ChildAge,
            settings.Mode,
            ParseDomains(settings.WhitelistJson),
            ParseDomains(settings.BlacklistJson),
            settings.BlockAdult,
            settings.BlockGambling,
            settings.BlockPhishing,
            settings.WarnSuspicious);
    }

    private static List<string> ParseDomains(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json) ?? [];
        }
        catch
        {
            return [];
        }
    }

    private static List<string> CleanDomains(IEnumerable<string>? domains)
    {
        return (domains ?? [])
            .Select(NormalizeDomain)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(500)
            .ToList();
    }

    private static string NormalizeDomain(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        var value = input.Trim().ToLowerInvariant();
        value = value.Replace("https://", string.Empty).Replace("http://", string.Empty);

        var slash = value.IndexOf('/');
        if (slash >= 0) value = value[..slash];

        var colon = value.IndexOf(':');
        if (colon >= 0) value = value[..colon];

        return value.StartsWith("www.") ? value[4..] : value;
    }
}