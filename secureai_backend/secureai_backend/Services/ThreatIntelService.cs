using System.Net;
using System.Text.RegularExpressions;
using secureai_backend.DTOs.Threat;

namespace secureai_backend.Services;

public class ThreatIntelService
{
    private static readonly string[] SuspiciousTlds =
    {
        "xyz", "top", "click", "work", "loan", "win", "download", "ru", "cn", "tk", "ml", "ga", "cf"
    };

    private static readonly string[] SensitiveKeywords =
    {
        "login", "signin", "verify", "confirm", "secure", "update", "account", "password",
        "bank", "wallet", "paypal", "otp", "invoice", "free", "bonus", "gift", "crack"
    };

    public ThreatIntelEnrichmentDto Analyze(string url)
    {
        var normalized = NormalizeUrl(url);
        Uri.TryCreate(normalized, UriKind.Absolute, out var uri);

        var scheme = uri?.Scheme ?? string.Empty;
        var host = uri?.Host.ToLowerInvariant() ?? string.Empty;
        var labels = host.Split('.', StringSplitOptions.RemoveEmptyEntries);
        var isIp = IPAddress.TryParse(host, out _);
        var tld = isIp || labels.Length == 0 ? string.Empty : labels[^1];
        var domain = isIp || labels.Length < 2
            ? host
            : $"{labels[^2]}.{labels[^1]}";

        var subdomainCount = isIp || labels.Length <= 2 ? 0 : labels.Length - 2;
        var pathDepth = uri?.AbsolutePath
            .Split('/', StringSplitOptions.RemoveEmptyEntries)
            .Length ?? 0;
        var queryParameterCount = CountQueryParameters(uri?.Query);
        var extension = GetFileExtension(uri?.AbsolutePath);
        var lower = normalized.ToLowerInvariant();
        var keywords = SensitiveKeywords
            .Where(k => lower.Contains(k, StringComparison.OrdinalIgnoreCase))
            .Distinct()
            .ToList();

        var indicators = new List<string>();
        if (scheme != "https")
        {
            indicators.Add("Không sử dụng HTTPS.");
        }

        if (isIp)
        {
            indicators.Add("Host là địa chỉ IP trực tiếp.");
        }

        if (subdomainCount >= 3)
        {
            indicators.Add($"Có nhiều tầng subdomain ({subdomainCount}).");
        }

        if (SuspiciousTlds.Contains(tld))
        {
            indicators.Add($"TLD .{tld} nằm trong nhóm rủi ro cao.");
        }

        if (normalized.Length >= 100)
        {
            indicators.Add($"URL dài bất thường ({normalized.Length} ký tự).");
        }

        if (host.Contains("xn--", StringComparison.OrdinalIgnoreCase))
        {
            indicators.Add("Domain dùng punycode, có thể che giấu ký tự giả mạo.");
        }

        if (normalized.Contains('@'))
        {
            indicators.Add("URL chứa ký tự @, thường dùng để đánh lừa phần host.");
        }

        if (keywords.Count > 0)
        {
            indicators.Add($"Có keyword nhạy cảm: {string.Join(", ", keywords)}.");
        }

        if (extension is ".exe" or ".zip" or ".rar" or ".scr" or ".bat" or ".cmd")
        {
            indicators.Add($"Trỏ tới file có phần mở rộng nguy hiểm ({extension}).");
        }

        if (Regex.Matches(normalized, "-").Count >= 3)
        {
            indicators.Add("URL chứa nhiều dấu gạch ngang.");
        }

        if (indicators.Count == 0)
        {
            indicators.Add("Không phát hiện indicator heuristic mạnh.");
        }

        return new ThreatIntelEnrichmentDto(
            normalized,
            scheme,
            host,
            domain,
            tld,
            scheme == "https",
            isIp,
            normalized.Length,
            subdomainCount,
            pathDepth,
            queryParameterCount,
            host.Contains("xn--", StringComparison.OrdinalIgnoreCase),
            normalized.Contains('@'),
            SuspiciousTlds.Contains(tld),
            extension,
            keywords,
            indicators.Distinct().ToList());
    }

    private static string NormalizeUrl(string url)
    {
        var trimmed = url.Trim();
        return trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
               trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
            ? trimmed
            : $"http://{trimmed}";
    }

    private static int CountQueryParameters(string? query)
    {
        if (string.IsNullOrWhiteSpace(query) || query == "?")
        {
            return 0;
        }

        return query.TrimStart('?')
            .Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Length;
    }

    private static string? GetFileExtension(string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return null;
        }

        var match = Regex.Match(path, @"\.[A-Za-z0-9]{2,5}$");
        return match.Success ? match.Value.ToLowerInvariant() : null;
    }
}
