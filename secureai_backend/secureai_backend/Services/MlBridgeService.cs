using System.Text;
using System.Text.Json;
using secureai_backend.DTOs.ML;

namespace secureai_backend.Services;

/// <summary>
/// Gọi secureai_ai (Python FastAPI) POST /predict.
/// Nhận kết quả BiLSTM+Attention phishing detection.
/// </summary>
public class MlBridgeService(HttpClient http, IConfiguration config)
{
    private static readonly JsonSerializerOptions _opts =
        new() { PropertyNameCaseInsensitive = true };

    public async Task<MlPredictResponse> PredictAsync(string url)
    {
        var baseUrl = config["MlApi:BaseUrl"] ?? "http://localhost:8000";
        var payload = JsonSerializer.Serialize(new { url });
        var content = new StringContent(payload, Encoding.UTF8, "application/json");

        HttpResponseMessage response;
        try
        {
            response = await http.PostAsync($"{baseUrl}/predict", content);
        }
        catch (HttpRequestException ex)
        {
            throw new InvalidOperationException(
                $"Không kết nối được ML API tại {baseUrl}: {ex.Message}");
        }

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException(
                $"ML API lỗi {(int)response.StatusCode}: {err}");
        }

        var json = await response.Content.ReadAsStringAsync();
        var raw = JsonSerializer.Deserialize<MlApiRaw>(json, _opts)
                   ?? throw new InvalidOperationException("ML API trả về dữ liệu rỗng");

        var topAttention = raw.TopAttention?
            .Select(a => new AttentionToken(a.Char, a.Weight))
            .ToList() ?? [];

        return new MlPredictResponse(
            Url: raw.Url ?? url,
            Label: raw.Label ?? "benign",
            RiskScore: raw.RiskScore,
            BenignProb: raw.Probabilities?.Benign ?? 0,
            PhishingProb: raw.Probabilities?.Phishing ?? 0,
            MalwareProb: raw.Probabilities?.Malware ?? 0,
            DefacementProb: raw.Probabilities?.Defacement ?? 0,
            TopAttention: topAttention,
            Action: raw.Action ?? "allow"
        );
    }
}
