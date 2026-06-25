using System.Net;
using System.Text.RegularExpressions;
using secureai_backend.DTOs.ML;
using secureai_backend.DTOs.Threat;
using secureai_backend.Models.Entities;
using secureai_backend.Models.Enums;

namespace secureai_backend.Services;

public class DecisionSupportService
{
    private static readonly string[] SensitiveKeywords =
    {
        "login", "signin", "verify", "confirm", "secure", "update", "account", "password", "bank", "wallet"
    };

    private static readonly string[] SuspiciousTlds =
    {
        ".xyz", ".top", ".click", ".work", ".loan", ".win", ".download", ".ru", ".cn", ".tk", ".ml", ".ga", ".cf"
    };

    public DecisionSupportDto BuildDecision(Threat threat, List<AttentionToken>? attention = null)
    {
        var reasons = BuildDecisionReasons(threat).Concat(BuildUrlIndicators(threat.Url).Take(3)).ToList();
        var recommendation = threat.RiskScore switch
        {
            >= 0.85 => "Block",
            >= 0.45 => "Review",
            _ => threat.PredictedLabel == "benign" ? "Allow" : "Review"
        };

        if (threat.PredictedLabel is "phishing" or "malware" && threat.RiskScore >= 0.60)
        {
            recommendation = threat.RiskScore >= 0.85 ? "Block" : "Review";
        }

        var nextSteps = recommendation switch
        {
            "Block" => new List<string>
            {
                "Block URL/domain at gateway or secure web proxy.",
                "Open an incident and assign analyst owner.",
                "Search logs for users who accessed this URL.",
                "Notify affected users if access was observed."
            },
            "Review" => new List<string>
            {
                "Inspect domain, redirect chain, and page content.",
                "Check whether the URL appears in emails or endpoint telemetry.",
                "Confirm or mark false positive after analyst review."
            },
            _ => new List<string>
            {
                "Allow traffic but keep audit record.",
                "Monitor for repeated submissions or new intelligence."
            }
        };

        var summary = recommendation switch
        {
            "Block" => "High-confidence malicious or high-risk URL. Immediate containment is recommended.",
            "Review" => "Suspicious URL needs analyst validation before final action.",
            _ => "Low-risk URL. No immediate containment action is required."
        };

        return new DecisionSupportDto(
            recommendation,
            threat.Severity.ToString(),
            summary,
            reasons.Distinct().Take(8).ToList(),
            nextSteps);
    }

    public RiskExplanationDto BuildRiskExplanation(Threat threat, List<AttentionToken>? attention = null)
    {
        var modelSignals = new List<string>
        {
            $"Predicted label: {threat.PredictedLabel}",
            $"Risk score: {(threat.RiskScore * 100):0.0}%",
            $"Benign probability: {(threat.BenignProb * 100):0.0}%",
            $"Phishing probability: {(threat.PhishingProb * 100):0.0}%",
            $"Malware probability: {(threat.MalwareProb * 100):0.0}%",
            $"Defacement probability: {(threat.DefacementProb * 100):0.0}%"
        };

        if (threat.PredictedLabel != "benign")
        {
            modelSignals.Add("Model classified this URL as non-benign.");
        }

        var highlights = (attention ?? new List<AttentionToken>())
            .OrderByDescending(t => t.Weight)
            .Take(6)
            .Select(t => $"'{DisplayChar(t.Char)}' weight {t.Weight:0.0000}")
            .ToList();

        return new RiskExplanationDto(
            $"{(threat.RiskScore * 100):0.0}% risk based on model probability and URL indicators.",
            modelSignals,
            BuildUrlIndicators(threat.Url),
            highlights);
    }

    public string BuildIncidentTitle(Threat threat)
        => $"{threat.Severity} {threat.PredictedLabel} URL detected";

    public string BuildIncidentReason(Threat threat)
        => string.Join("; ", BuildDecision(threat).Reasons.Take(4));

    private static IEnumerable<string> BuildDecisionReasons(Threat threat)
    {
        if (threat.RiskScore >= 0.85)
        {
            yield return "Risk score is above the block threshold (85%).";
        }
        else if (threat.RiskScore >= 0.60)
        {
            yield return "Risk score is above the high-alert threshold (60%).";
        }
        else if (threat.RiskScore >= 0.45)
        {
            yield return "Risk score is in the review band.";
        }

        if (threat.PredictedLabel != "benign")
        {
            yield return $"Model label is {threat.PredictedLabel}.";
        }

        if (threat.PhishingProb >= 0.50)
        {
            yield return $"Phishing probability is {(threat.PhishingProb * 100):0.0}%.";
        }

        if (threat.MalwareProb >= 0.40)
        {
            yield return $"Malware probability is {(threat.MalwareProb * 100):0.0}%.";
        }

        if (threat.DefacementProb >= 0.40)
        {
            yield return $"Defacement probability is {(threat.DefacementProb * 100):0.0}%.";
        }
    }

    private static List<string> BuildUrlIndicators(string url)
    {
        var indicators = new List<string>();
        var normalized = url.StartsWith("http", StringComparison.OrdinalIgnoreCase) ? url : $"http://{url}";

        if (Uri.TryCreate(normalized, UriKind.Absolute, out var uri))
        {
            var host = uri.Host.ToLowerInvariant();
            if (uri.Scheme != "https")
            {
                indicators.Add("URL does not use HTTPS.");
            }

            if (IPAddress.TryParse(host, out _))
            {
                indicators.Add("Host is a raw IP address.");
            }

            if (host.StartsWith("xn--", StringComparison.OrdinalIgnoreCase) || host.Contains(".xn--", StringComparison.OrdinalIgnoreCase))
            {
                indicators.Add("Domain uses punycode, which can hide lookalike characters.");
            }

            if (host.Count(c => c == '.') >= 3)
            {
                indicators.Add("Domain has many subdomain levels.");
            }

            if (SuspiciousTlds.Any(tld => host.EndsWith(tld, StringComparison.OrdinalIgnoreCase)))
            {
                indicators.Add("Domain uses a high-risk top-level domain.");
            }
        }

        var lower = url.ToLowerInvariant();
        if (lower.Contains('@'))
        {
            indicators.Add("URL contains '@', often used for user-info obfuscation.");
        }

        if (url.Length > 100)
        {
            indicators.Add($"URL is unusually long ({url.Length} characters).");
        }

        var keywordHits = SensitiveKeywords.Where(k => lower.Contains(k)).Distinct().ToList();
        if (keywordHits.Count > 0)
        {
            indicators.Add($"URL contains sensitive keywords: {string.Join(", ", keywordHits)}.");
        }

        if (url.Count(c => c == '-') >= 3)
        {
            indicators.Add("URL contains many hyphens, a common obfuscation signal.");
        }

        if (Regex.IsMatch(url, @"\.(exe|zip|rar|scr|bat|cmd)(\?|#|$)", RegexOptions.IgnoreCase))
        {
            indicators.Add("URL points to a potentially dangerous file extension.");
        }

        if (indicators.Count == 0)
        {
            indicators.Add("No strong URL heuristic indicator was triggered.");
        }

        return indicators.Distinct().ToList();
    }

    private static string DisplayChar(string value)
        => string.IsNullOrWhiteSpace(value) ? "space" : value;
}
