namespace secureai_backend.DTOs.Email;

public record EmailAnalyzeRequest(
    string RawEmail,       // raw email string (headers + body)
    bool AnalyzeUrls = true
);
