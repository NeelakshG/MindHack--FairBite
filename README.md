# FairBite

FairBite is a bias-aware restaurant rating system that detects and corrects for cultural and linguistic bias in Yelp reviews. It uses a trained NLP sentiment model to measure what reviewers actually expressed in their writing, then compares that against their star ratings to surface systematic disparities across cuisine types.

---

## The Problem

Star ratings on platforms like Yelp are treated as objective measures of quality, but they are produced by humans whose language reflects cultural familiarity and expectation. Reviewers unconsciously use different vocabulary and tone when writing about Mexican food versus French food — and when that pattern is systematic across thousands of reviews, certain cuisines end up with ratings that don't accurately reflect the food.

FairBite detects this bias and produces a corrected rating.

---

## How It Works

1. A bidirectional LSTM sentiment model is trained on Yelp review text, producing a continuous sentiment score in [0, 1] for any input review.
2. Every review in the dataset is scored. For each city–cuisine pair, the mean sentiment score is compared against the city-wide baseline.
3. The gap between a cuisine's sentiment average and the city average is the **bias score**.
4. Each business receives an **adjusted rating** that partially corrects for detected bias.

```
bias_score      = cuisine_avg_sentiment − city_avg_sentiment
adjusted_rating = original_rating + 0.5 × bias_score  (clipped to [1, 5])
```

TF-IDF analysis runs in parallel to identify the vocabulary most distinctive to each cuisine, providing interpretable evidence of the language patterns behind any detected bias.

---

## Project Structure

```
├── ml-server/                  # Sentiment model training and inference API
│   ├── model/
│   │   ├── sentiment_model.py  # Bidirectional LSTM architecture
│   │   └── train.py            # Training script (STSRS balancing, MSE loss)
│   ├── utils/
│   │   ├── clean_text.py       # Tokenization, stopword removal, lemmatization
│   │   ├── data_loader.py      # Yelp dataset loader (businesses + reviews)
│   │   └── encode.py           # Vocabulary builder and sequence encoder
│   └── app.py                  # FastAPI inference server (POST /score_review)
│
├── bias-server/                # Bias computation and REST API
│   ├── api/
│   │   ├── routes.py           # API endpoints
│   │   └── schemas.py          # Pydantic response models
│   ├── bias/
│   │   ├── scoring.py          # Bias score computation and data loading
│   │   └── explanation.py      # Human-readable bias explanation generator
│   ├── precompute/
│   │   └── run_precompute.py   # Offline pipeline: score reviews, compute averages, TF-IDF, sample reviews
│   └── data/                   # Precomputed JSON output (averages, top_words, sample_reviews)
│
├── frontend/                   # Next.js web interface
│   └── src/
│       ├── app/
│       │   ├── App.tsx                     # Main search page
│       │   ├── compare/page.tsx            # Compare cities for a cuisine
│       │   ├── compare-cuisines/page.tsx   # Compare cuisines within a city
│       │   └── components/
│       │       ├── Nav.tsx
│       │       ├── SearchBar.tsx
│       │       ├── RestaurantCard.tsx
│       │       ├── BiasInsightPanel.tsx
│       │       └── ReviewsPanel.tsx
│       └── lib/
│           └── api.ts                      # API client
│
└── data/                       # Yelp Academic Dataset (not committed)
    ├── business.json
    └── review.json
```

---

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- Yelp Academic Dataset (`business.json`, `review.json`) placed in `data/`

---

### 1. Train the Sentiment Model

```bash
cd ml-server
pip install -r requirements.txt
python model/train.py
```

This saves `model/saved/model.pt` and `model/saved/vocab.json`.

---

### 2. Start the ML Server

```bash
cd ml-server
uvicorn app:app --port 8000
```

---

### 3. Run Precompute

With the ML server running, score all reviews and generate the bias data:

```bash
cd bias-server
python precompute/run_precompute.py
```

This produces three files in `bias-server/data/`:
- `averages.json` — sentiment averages and bias scores per city/cuisine
- `top_words.json` — TF-IDF top words per cuisine
- `sample_reviews.json` — most illustrative reviews (largest star/sentiment gap)

---

### 4. Start the Bias Server

```bash
cd bias-server
uvicorn app:app --port 8001
```

---

### 5. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cities` | List available cities |
| GET | `/cuisines` | List available cuisines |
| GET | `/bias/{city}/{cuisine}` | Bias score and adjusted ratings for a cuisine in a city |
| GET | `/reviews/{city}/{cuisine}` | Most illustrative reviews (highest star/sentiment gap) |
| GET | `/top_words` | TF-IDF top words per cuisine |
| GET | `/city/{city}` | Overview of all cuisines in a city |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Model | PyTorch — Bidirectional LSTM |
| ML API | FastAPI |
| Bias API | FastAPI |
| NLP preprocessing | NLTK |
| TF-IDF | scikit-learn |
| Data processing | pandas |
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Deployment | Render |
| Model versioning | Git LFS |
| Dataset | Yelp Academic Dataset |

---

## Data

This project uses the [Yelp Academic Dataset](https://www.yelp.com/dataset), available for academic and research use. The dataset files are not included in this repository. Download and place `business.json` and `review.json` in the `data/` directory before running precompute.

---

## Cuisines and Cities

**Cuisines:** Mexican, French, Chinese, Italian, Japanese

**Cities:** Philadelphia PA · Tampa FL · Indianapolis IN
