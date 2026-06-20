namespace secureai_backend.DTOs.Email;

public record EmailAnalyzeResponse(
    string Verdict,      // benign / suspicious / phishing
    double RiskScore,
    List<string> Reasons,
    HeaderFlags HeaderFlags,
    BodyFlags BodyFlags,
    List<UrlResult> UrlsFound,
    string Action        // allow / review / block
);

public record HeaderFlags(
    bool SpfPass,
    bool DkimPass,
    bool DmarcPass,
    bool ReplyToMismatch,
    bool SuspiciousXMailer,
    string FromDomain,
    string Subject
);

public record BodyFlags(
    int UrgencyKeywords,
    int PhishingKeywords,
    bool BrandMismatch,
    List<string> MentionedBrands,
    bool HasHtmlForm,
    int LinkCount
);

public record UrlResult(
    string Url,
    string Label,
    double RiskScore,
    string Action
);
