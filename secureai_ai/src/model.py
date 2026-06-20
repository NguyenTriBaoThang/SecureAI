import torch
import torch.nn as nn


class SelfAttention(nn.Module):
    """
    Attention khớp chính xác với checkpoint:
      attention.attn.weight  shape [256, 256]  bias=False
      attention.v.weight     shape [1,   256]  bias=False
    """

    def __init__(self, hidden_dim: int):
        super().__init__()
        self.attn = nn.Linear(hidden_dim * 2, hidden_dim * 2, bias=True)
        self.v    = nn.Linear(hidden_dim * 2, 1,              bias=False)

    def forward(self, lstm_out: torch.Tensor):
        # lstm_out: (batch, seq_len, hidden*2)
        energy  = torch.tanh(self.attn(lstm_out))       # (batch, seq_len, hidden*2)
        scores  = self.v(energy).squeeze(-1)             # (batch, seq_len)
        weights = torch.softmax(scores, dim=-1)          # (batch, seq_len)
        context = torch.bmm(weights.unsqueeze(1), lstm_out).squeeze(1)  # (batch, hidden*2)
        return context, weights


class BiLSTMAttention(nn.Module):
    """
    BiLSTM + Attention — khớp chính xác với notebook checkpoint.
    State dict keys:
      embedding.weight
      bilstm.weight_ih_l0 / weight_hh_l0 / bias_ih_l0 / bias_hh_l0  (x2 layers x2 directions)
      layer_norm.weight / layer_norm.bias
      attention.attn.weight  [256, 256]
      attention.v.weight     [1,   256]
      fc.weight / fc.bias
    """

    def __init__(
        self,
        vocab_size:  int,
        embed_dim:   int,
        hidden_dim:  int,
        num_layers:  int,
        num_classes: int,
        dropout:     float = 0.3,
    ):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.bilstm    = nn.LSTM(
            embed_dim, hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if num_layers > 1 else 0,
        )
        self.layer_norm = nn.LayerNorm(hidden_dim * 2)
        self.attention  = SelfAttention(hidden_dim)
        self.dropout    = nn.Dropout(dropout)
        self.fc         = nn.Linear(hidden_dim * 2, num_classes)

    def forward(self, x: torch.Tensor):
        emb              = self.dropout(self.embedding(x))
        lstm_out, _      = self.bilstm(emb)
        lstm_out         = self.layer_norm(lstm_out)
        context, weights = self.attention(lstm_out)
        out              = self.fc(self.dropout(context))
        return out, weights
