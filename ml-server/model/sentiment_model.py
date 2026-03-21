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
        self.fc = nn.Linear(hidden_dim * 2, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        embedded = self.embedding(x)                    
        lstm_out, (hidden, _) = self.lstm(embedded)    

        forward_hidden = hidden[-2]   
        backward_hidden = hidden[-1]  
        combined = torch.cat((forward_hidden, backward_hidden), dim=1)  

        out = self.dropout(combined)
        out = self.fc(out)
        out = torch.sigmoid(out)
        return out.squeeze(1)
