using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using secureai_backend.DTOs.Email;
using secureai_backend.Services;

namespace secureai_backend.Controllers;

[ApiController]
[Route("api/email")]
[Authorize]
public class EmailController(
    IHttpClientFactory httpClientFactory,
    IConfiguration config,
    AuditService auditService) : ControllerBase
{
    private static readonly JsonSerializerOptions _opts =
        new() { PropertyNameCaseInsensitive = true };

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    /// <summary>Phân tích email phishing — gửi raw email string.</summary>
    [HttpPost("analyze")]
    [Authorize(Roles = "Admin,Analyst")]
    public async Task<ActionResult<EmailAnalyzeResponse>> Analyze(
        [FromBody] EmailAnalyzeRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.RawEmail))
            return BadRequest(new { message = "RawEmail không được để trống" });

        try
        {
            var baseUrl = config["MlApi:BaseUrl"] ?? "http://localhost:8000";
            var http = httpClientFactory.CreateClient();
            http.Timeout = TimeSpan.FromSeconds(30);

            var payload = JsonSerializer.Serialize(new
            {
                raw_email = req.RawEmail,
                analyze_urls = req.AnalyzeUrls
            });
            var content = new StringContent(payload, Encoding.UTF8, "application/json");
            var response = await http.PostAsync($"{baseUrl}/analyze/email", content);

            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                return StatusCode(502, new { message = $"ML API lỗi: {err}" });
            }

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<EmailAnalyzeResponse>(json, _opts);

            if (result == null)
                return StatusCode(500, new { message = "ML API trả về dữ liệu rỗng" });

            await auditService.LogAsync(UserId, "ANALYZE_EMAIL",
                detail: $"verdict={result.Verdict} risk={result.RiskScore}");

            return Ok(result);
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(502, new { message = $"Không kết nối được ML API: {ex.Message}" });
        }
    }
}