import os
import torch

from model.sentiment_model import SentimentLSTM
from utils.clean_text import TextCleaner
from utils.encode import Vocabulary, encode_and_pad

SAVE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model", "saved")
MAX_LEN = 200

# Load model and vocab
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


def predict(text: str) -> float:
    cleaned = cleaner.clean(text)
    encoded = encode_and_pad([cleaned], vocab, MAX_LEN).to(device)
    with torch.no_grad():
        score = model(encoded).item()
    return round(score, 4)


# Test cases: (review text, expected score range (min, max))
# Labels map: 1 star=0.0, 2 stars=0.25, 3 stars=0.5, 4 stars=0.75, 5 stars=1.0
test_cases = [
    # 5-star sentiment (expected ~0.75–1.0)
    ("Amazing food and wonderful service! Best restaurant I've ever been to.", 0.75, 1.0),
    ("Absolutely loved this place. The pasta was perfectly cooked and the staff was so friendly.", 0.75, 1.0),
    ("Great atmosphere, delicious meals, and very reasonable prices. Will definitely come back!", 0.75, 1.0),

    # 1-star sentiment (expected ~0.0–0.25)
    ("Terrible experience. The food was cold and the waiter was incredibly rude.", 0.0, 0.25),
    ("Worst restaurant ever. We waited an hour for soggy, tasteless food. Never coming back.", 0.0, 0.25),
    ("Disgusting. Found a hair in my soup and the manager didn't even apologize.", 0.0, 0.25),

    # 4-star / moderately positive (expected ~0.5–0.85)
    ("Pretty good food. Nothing extraordinary but I'd eat here again.", 0.5, 0.85),

    # 2-star / moderately negative (expected ~0.15–0.5)
    ("The food was mediocre at best. Overpriced for what you get.", 0.15, 0.5),

    # 3-star / neutral (expected ~0.35–0.65)
    ("It was okay. Nothing special but nothing bad either. Average experience.", 0.35, 0.65),
    ("Decent food, slow service. Would maybe try again if nearby.", 0.35, 0.65),
]

if __name__ == "__main__":
    print(f"Device: {device}")
    print(f"Vocab size: {len(vocab)}")
    print(f"{'='*70}")

    passed = 0
    total = len(test_cases)

    for text, exp_min, exp_max in test_cases:
        score = predict(text)
        in_range = exp_min <= score <= exp_max
        passed += int(in_range)

        status = "PASS" if in_range else "FAIL"
        print(f"\n[{status}] Score: {score:.4f} (expected {exp_min:.2f}–{exp_max:.2f})")
        print(f"  Review: \"{text[:80]}{'...' if len(text) > 80 else ''}\"")

    print(f"\n{'='*70}")
    print(f"Results: {passed}/{total} passed")