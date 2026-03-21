import os
import sys
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.model_selection import train_test_split

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from model.sentiment_model import SentimentLSTM
from utils.clean_text import TextCleaner
from utils.data_loader import YelpDataLoader
from utils.encode import Vocabulary, encode_and_pad

SAVE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "saved")

MAX_LEN = 200
BATCH_SIZE = 64
EPOCHS = 10
LR = 1e-3
MIN_FREQ = 2
EMBED_DIM = 128
HIDDEN_DIM = 256
NUM_LAYERS = 2
DROPOUT = 0.3


def load_data():
    loader = YelpDataLoader()
    businesses = loader.load_businesses()
    reviews = loader.load_reviews(set(businesses["business_id"]))

    reviews = reviews[reviews["stars"] != 3]
    reviews["label"] = (reviews["stars"] >= 4).astype(int)
    return reviews


def train():
    print("Loading data...")
    df = load_data()
    print(f"Loaded {len(df)} reviews")

    print("Cleaning text...")
    cleaner = TextCleaner()
    df["clean_text"] = df["text"].apply(cleaner.clean)

    print("Building vocabulary...")
    vocab = Vocabulary()
    vocab.build(df["clean_text"].tolist(), min_freq=MIN_FREQ)
    print(f"Vocabulary size: {len(vocab)}")

    train_texts, val_texts, train_labels, val_labels = train_test_split(
        df["clean_text"].tolist(), df["label"].tolist(), test_size=0.2, random_state=42
    )

    X_train = encode_and_pad(train_texts, vocab, MAX_LEN)
    X_val = encode_and_pad(val_texts, vocab, MAX_LEN)
    y_train = torch.tensor(train_labels, dtype=torch.float)
    y_val = torch.tensor(val_labels, dtype=torch.float)

    train_loader = DataLoader(TensorDataset(X_train, y_train), batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(TensorDataset(X_val, y_val), batch_size=BATCH_SIZE)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = SentimentLSTM(
        vocab_size=len(vocab),
        embed_dim=EMBED_DIM,
        hidden_dim=HIDDEN_DIM,
        num_layers=NUM_LAYERS,
        dropout=DROPOUT
    ).to(device)

    criterion = nn.BCELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=LR)

    for epoch in range(EPOCHS):
        model.train()
        total_loss = 0
        correct = 0
        total = 0

        for X_batch, y_batch in train_loader:
            X_batch, y_batch = X_batch.to(device), y_batch.to(device)
            optimizer.zero_grad()
            preds = model(X_batch)
            loss = criterion(preds, y_batch)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * len(y_batch)
            correct += ((preds >= 0.5) == y_batch.bool()).sum().item()
            total += len(y_batch)

        train_acc = correct / total

        model.eval()
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for X_batch, y_batch in val_loader:
                X_batch, y_batch = X_batch.to(device), y_batch.to(device)
                preds = model(X_batch)
                val_correct += ((preds >= 0.5) == y_batch.bool()).sum().item()
                val_total += len(y_batch)

        val_acc = val_correct / val_total
        print(f"Epoch {epoch+1}/{EPOCHS} — Loss: {total_loss/total:.4f} — Train Acc: {train_acc:.4f} — Val Acc: {val_acc:.4f}")

    os.makedirs(SAVE_DIR, exist_ok=True)
    torch.save(model.state_dict(), os.path.join(SAVE_DIR, "model.pt"))
    vocab.save(os.path.join(SAVE_DIR, "vocab.json"))
    print(f"Model and vocab saved to {SAVE_DIR}")

if __name__ == "__main__":
    train()
