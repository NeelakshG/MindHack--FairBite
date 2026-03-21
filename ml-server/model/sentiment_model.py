import torch
import torch.nn as nn


class SentimentLSTM(nn.Module):
    def __init__(self, vocab_size: int, embed_dim: int = 128, hidden_dim: int = 256,
                 num_layers: int = 2, dropout: float = 0.3):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(
            input_size=embed_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
            bidirectional=True
        )
        self.dropout = nn.Dropout(dropout)
        # bidirectional doubles the hidden dim
        self.fc = nn.Linear(hidden_dim * 2, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (batch, seq_len) of token indices
        embedded = self.embedding(x)                    # (batch, seq_len, embed_dim)
        lstm_out, (hidden, _) = self.lstm(embedded)     # lstm_out: (batch, seq_len, hidden*2)

        # concatenate final forward and backward hidden states
        # hidden shape: (num_layers*2, batch, hidden_dim)
        forward_hidden = hidden[-2]   # last forward layer
        backward_hidden = hidden[-1]  # last backward layer
        combined = torch.cat((forward_hidden, backward_hidden), dim=1)  # (batch, hidden*2)

        out = self.dropout(combined)
        out = self.fc(out)              # (batch, 1)
        out = torch.sigmoid(out)        # sentiment score between 0 and 1
        return out.squeeze(1)           # (batch,)
