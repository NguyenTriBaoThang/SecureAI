using System.Text.Json;
using secureai_backend.DTOs.Incident;
using secureai_backend.DTOs.ML;
using secureai_backend.DTOs.Threat;
using secureai_backend.Models.Entities;

namespace secureai_backend.Services;

public static class ThreatDtoMapper
{
    public static List<AttentionToken> DeserializeAttention(string json)
    {
        try { return JsonSerializer.Deserialize<List<AttentionToken>>(json) ?? []; }
        catch { return []; }
    }

    public static List<AnalystNoteDto> MapNotes(IEnumerable<AnalystLabel> labels)
        => labels
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new AnalystNoteDto(
                l.Id,
                l.Label,
                l.Note,
                l.Analyst?.Email ?? l.AnalystId.ToString(),
                l.CreatedAt))
            .ToList();

    public static IncidentSummaryDto? MapIncident(IEnumerable<Incident> incidents)
    {
        var incident = incidents
            .OrderByDescending(i => i.UpdatedAt)
            .FirstOrDefault();

        return incident == null
            ? null
            : new IncidentSummaryDto(
                incident.Id,
                incident.Status,
                incident.Priority,
                incident.Title,
                incident.RecommendedAction,
                incident.CreatedAt,
                incident.UpdatedAt);
    }
}
