namespace secureai_backend.DTOs.Dashboard;

public record DashboardSummaryDto(
    int TotalThreats,
    int TodayThreats,
    int UnreadAlerts,
    int CriticalAlerts,
    int PendingReview,
    int OpenIncidents,
    int InvestigatingAlerts,
    LabelBreakdownDto LabelBreakdown
);
