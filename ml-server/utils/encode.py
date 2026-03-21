import json
import torch
from collections import Counter


class Vocabulary:
    PAD_TOKEN = "<PAD>"
    UNK_TOKEN = "<UNK>"

    def __init__(self):
        self.word2idx = {self.PAD_TOKEN: 0, self.UNK_TOKEN: 1}
        self.idx2word = {0: self.PAD_TOKEN, 1: self.UNK_TOKEN}

    def build(self, texts: list[str], min_freq: int = 2):
        counter = Counter()
        for text in texts:
            counter.update(text.split())

        for word, freq in counter.items():
            if freq >= min_freq and word not in self.word2idx:
                idx = len(self.word2idx)
                self.word2idx[word] = idx
                self.idx2word[idx] = word

    def __len__(self):
        return len(self.word2idx)

    def encode(self, text: str) -> list[int]:
        return [self.word2idx.get(w, self.word2idx[self.UNK_TOKEN]) for w in text.split()]

    def save(self, path: str):
        with open(path, "w") as f:
            json.dump(self.word2idx, f)

    def load(self, path: str):
        with open(path) as f:
            self.word2idx = json.load(f)
        self.idx2word = {v: k for k, v in self.word2idx.items()}


def encode_and_pad(texts: list[str], vocab: Vocabulary, max_len: int = 200) -> torch.Tensor:
    encoded = []
    for text in texts:
        tokens = vocab.encode(text)[:max_len]
        padded = tokens + [0] * (max_len - len(tokens))
        encoded.append(padded)
    return torch.tensor(encoded, dtype=torch.long)
