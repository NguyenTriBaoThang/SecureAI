namespace secureai_backend.DTOs.ML;

/// <summary>
/// Một ký tự trong URL kèm attention weight từ BiLSTM+Self-Attention.
/// Dùng để render Attention Heatmap trên React frontend.
/// </summary>
public record AttentionToken(string Char, double Weight);
