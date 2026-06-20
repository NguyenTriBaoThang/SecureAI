using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using secureai_backend.DTOs.Baseline;
using secureai_backend.Services;

namespace secureai_backend.Controllers;

[ApiController]
[Route("api/baseline")]
[Authorize]
public class BaselineController(
    IHttpClientFactory httpClientFactory,
    IConfiguration config,
    AuditService auditService) : ControllerBase
{
    private static readonly JsonSerializerOptions _opts =
        new() { PropertyNameCaseInsensitive = true };

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    /// <summary>So sánh BiLSTM với Blacklist, Rule-based, LightGBM.</summary>
    [HttpPost("compare")]
    public async Task<ActionResult<BaselineResponse>> Compare(
        [FromBody] BaselineRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Url))
            return BadRequest(new { message = "URL không được để trống" });

        try
        {
            var baseUrl = config["MlApi:BaseUrl"] ?? "http://localhost:8000";
            var http = httpClientFactory.CreateClient();
            http.Timeout = TimeSpan.FromSeconds(30);

            var payload = JsonSerializer.Serialize(new { url = req.Url });
            var content = new StringContent(payload, Encoding.UTF8, "application/json");
            var response = await http.PostAsync($"{baseUrl}/baseline/compare", content);

            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                return StatusCode(502, new { message = $"ML API lỗi: {err}" });
            }

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<BaselineResponse>(json, _opts);

            if (result == null)
                return StatusCode(500, new { message = "ML API trả về dữ liệu rỗng" });

            await auditService.LogAsync(UserId, "BASELINE_COMPARE", detail: req.Url);
            return Ok(result);
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(502, new { message = $"Không kết nối được ML API: {ex.Message}" });
        }
    }
}