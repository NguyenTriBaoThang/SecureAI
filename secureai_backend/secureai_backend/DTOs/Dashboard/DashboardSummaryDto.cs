namespace secureai_backend.DTOs.Dashboard;

public record DashboardSummaryDto(
    int TotalThreats,
    int TodayThreats,
    int UnreadAlerts,
    int CriticalAlerts,
    int PendingReview,
    LabelBreakdownDto LabelBreakdown
);
