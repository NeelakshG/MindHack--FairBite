import os
import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from model.sentiment_model import SentimentLSTM
from utils.clean_text import TextCleaner
from utils.encode import Vocabulary, encode_and_pad

app = FastAPI(title="fairBite ML Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[""],
    allow_methods=[""],
    allow_headers=["*"],
)

SAVE_DIR = os.path.join(os.path.dirname(os.path.abspath(file)), "model", "saved")
MAX_LEN = 200

cleaner = TextCleaner()
vocab = Vocabulary()
vocab.load(os.path.join(SAVE_DIR, "vocab.json"))

if torch.cuda.is_available():
    device = torch.device("cuda")
elif torch.backends.mps.is_available():
    device = torch.device("mps")
else:
    device = torch.device("cpu")

model = SentimentLSTM(vocab_size=len(vocab))
model.load_state_dict(torch.load(os.path.join(SAVE_DIR, "model.pt"), map_location=device))
model.to(device)
model.eval()


class ReviewRequest(BaseModel):
    text: str


class SentimentResponse(BaseModel):
    sentiment: float


@app.post("/score_review", response_model=SentimentResponse)
def score_review(req: ReviewRequest):
    cleaned = cleaner.clean(req.text)
    encoded = encode_and_pad([cleaned], vocab, MAX_LEN).to(device)
    with torch.no_grad():
        score = model(encoded).item()
        score = max(0.0, min(1.0, score))
    return SentimentResponse(sentiment=round(score, 4))


@app.get("/health")
def health():
    return {"status": "ok"}