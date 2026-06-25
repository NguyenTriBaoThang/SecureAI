namespace secureai_backend.DTOs.Threat;

public record ThreatIntelEnrichmentDto(
    string NormalizedUrl,
    string Scheme,
    string Host,
    string Domain,
    string Tld,
    bool UsesHttps,
    bool IsIpAddress,
    int UrlLength,
    int SubdomainCount,
    int PathDepth,
    int QueryParameterCount,
    bool HasPunycode,
    bool ContainsAtSymbol,
    bool HasSuspiciousTld,
    string? FileExtension,
    List<string> SuspiciousKeywords,
    List<string> Indicators
);
