import os
import sys
import json
import requests
import pandas as pd
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(BASE_DIR, ".env"))
sys.path.append(os.path.join(BASE_DIR, "ml-server"))

from utils.data_loader import YelpDataLoader

ML_SERVER_URL = os.getenv("ML_SERVER_URL", "http://localhost:8000")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
TOP_N_WORDS = 10


def score_review(text: str) -> float:
    resp = requests.post(f"{ML_SERVER_URL}/score_review", json={"text": text}, timeout=120)
    resp.raise_for_status()
    return resp.json()["sentiment"]


def extract_adjectives(text: str) -> str:
    """Extract only adjectives and adverbs from text using NLTK POS tagging."""
    import nltk
    nltk.download('averaged_perceptron_tagger_eng', quiet=True)
    nltk.download('punkt_tab', quiet=True)
    tokens = nltk.word_tokenize(text.lower())
    tagged = nltk.pos_tag(tokens)
    adj_tags = {"JJ", "JJR", "JJS", "RB", "RBR", "RBS"}
    return " ".join(word for word, tag in tagged if tag in adj_tags and len(word) > 2)


def compute_top_words(reviews_df: pd.DataFrame, top_n: int = TOP_N_WORDS) -> dict:
    """Extract distinctive evaluative words per cuisine using adjective-only TF-IDF."""
    import numpy as np

    cuisine_groups = {c: reviews_df[reviews_df["cuisine"] == c] for c in reviews_df["cuisine"].unique()}
    min_count = min(len(g) for g in cuisine_groups.values() if len(g) > 0)
    print(f"  Balancing TF-IDF: sampling {min_count} reviews per cuisine")

    print("  Extracting adjectives from reviews (this may take a moment)...")
    all_texts = []
    cuisine_labels = []
    for cuisine, group in cuisine_groups.items():
        sampled = group.sample(n=min_count, random_state=42)
        adj_texts = [extract_adjectives(t) for t in sampled["text"]]
        all_texts.extend(adj_texts)
        cuisine_labels.extend([cuisine] * len(sampled))

    vectorizer = TfidfVectorizer(max_features=5000, stop_words="english")
    tfidf_matrix = vectorizer.fit_transform(all_texts)
    feature_names = vectorizer.get_feature_names_out()

    global_avg = tfidf_matrix.mean(axis=0).A1

    cuisine_labels_arr = np.array(cuisine_labels)
    top_words = {}
    for cuisine in cuisine_groups:
        mask = cuisine_labels_arr == cuisine
        cuisine_avg = tfidf_matrix[mask].mean(axis=0).A1
        distinctive = cuisine_avg - global_avg
        top_indices = distinctive.argsort()[-top_n:][::-1]
        top_words[cuisine] = [feature_names[i] for i in top_indices]

    return top_words


def main():
    print("Loading businesses...")
    loader = YelpDataLoader()
    businesses = loader.load_businesses()
    print(f"Found {len(businesses)} restaurants")

    print("Loading reviews...")
    reviews = loader.load_reviews(set(businesses["business_id"]))
    print(f"Found {len(reviews)} reviews")

    # Merge to get cuisine and city per review
    reviews = reviews.merge(businesses[["business_id", "cuisine", "city"]], on="business_id")

    # Sample reviews to keep scoring feasible (500 per cuisine per city)
    MAX_PER_GROUP = 500
    sampled = reviews.groupby(["city", "cuisine"], group_keys=False).apply(
        lambda g: g.sample(n=min(len(g), MAX_PER_GROUP), random_state=42)
    ).reset_index(drop=True)
    print(f"Sampled {len(sampled)} from {len(reviews)} total reviews ({MAX_PER_GROUP} max per cuisine/city)")
    reviews = sampled

    # Score each review via ml-server
    print(f"Scoring {len(reviews)} reviews via ml-server...")
    sentiments = []
    for i, text in enumerate(reviews["text"]):
        try:
            score = score_review(text)
        except Exception as e:
            print(f"  Error scoring review {i}: {e}")
            score = 0.5
        sentiments.append(score)
        if (i + 1) % 500 == 0:
            print(f"  Scored {i + 1}/{len(reviews)}")

    reviews["sentiment"] = sentiments

    # Compute averages per cuisine per city
    print("Computing averages...")
    averages = {}
    for city in reviews["city"].unique():
        city_reviews = reviews[reviews["city"] == city]
        city_avg = city_reviews["sentiment"].mean()

        averages[city] = {"city_avg_sentiment": round(city_avg, 4), "cuisines": {}}

        for cuisine in city_reviews["cuisine"].unique():
            cuisine_reviews = city_reviews[city_reviews["cuisine"] == cuisine]
            cuisine_avg = cuisine_reviews["sentiment"].mean()
            bias_score = cuisine_avg - city_avg

            # Compute adjusted ratings for businesses of this cuisine in this city
            cuisine_biz = cuisine_reviews.groupby("business_id").agg(
                avg_stars=("stars", "mean"),
                avg_sentiment=("sentiment", "mean"),
                review_count=("review_id", "count")
            ).reset_index()

            adjusted_ratings = {}
            for _, row in cuisine_biz.iterrows():
                adjusted = row["avg_stars"] + 0.5 * bias_score
                adjusted = max(1.0, min(5.0, adjusted))
                adjusted_ratings[row["business_id"]] = {
                    "original_rating": round(row["avg_stars"], 2),
                    "adjusted_rating": round(adjusted, 2),
                    "avg_sentiment": round(row["avg_sentiment"], 4),
                    "review_count": int(row["review_count"])
                }

            averages[city]["cuisines"][cuisine] = {
                "avg_sentiment": round(cuisine_avg, 4),
                "bias_score": round(bias_score, 4),
                "num_reviews": len(cuisine_reviews),
                "businesses": adjusted_ratings
            }

    print("Computing top TF-IDF words per cuisine...")
    top_words = compute_top_words(reviews)

    print("Sampling illustrative reviews per cuisine per city...")
    sample_reviews = {}
    for city in reviews["city"].unique():
        sample_reviews[city] = {}
        city_reviews = reviews[reviews["city"] == city]
        for cuisine in city_reviews["cuisine"].unique():
            cuisine_reviews = city_reviews[city_reviews["cuisine"] == cuisine].copy()
            # Sort by gap between normalised stars and sentiment (most divergent first)
            cuisine_reviews["star_norm"] = (cuisine_reviews["stars"] - 1) / 4
            cuisine_reviews["gap"] = abs(cuisine_reviews["star_norm"] - cuisine_reviews["sentiment"])
            top = cuisine_reviews.nlargest(5, "gap")
            sample_reviews[city][cuisine] = [
                {
                    "text": row["text"][:400],
                    "stars": int(row["stars"]),
                    "sentiment": round(float(row["sentiment"]), 4),
                }
                for _, row in top.iterrows()
            ]

    os.makedirs(DATA_DIR, exist_ok=True)

    averages_path = os.path.join(DATA_DIR, "averages.json")
    with open(averages_path, "w") as f:
        json.dump(averages, f, indent=2)
    print(f"Saved averages to {averages_path}")

    top_words_path = os.path.join(DATA_DIR, "top_words.json")
    with open(top_words_path, "w") as f:
        json.dump(top_words, f, indent=2)
    print(f"Saved top words to {top_words_path}")

    sample_reviews_path = os.path.join(DATA_DIR, "sample_reviews.json")
    with open(sample_reviews_path, "w") as f:
        json.dump(sample_reviews, f, indent=2)
    print(f"Saved sample reviews to {sample_reviews_path}")

    print("\n=== Summary ===")
    for city, data in averages.items():
        print(f"\n{city} (city avg: {data['city_avg_sentiment']})")
        for cuisine, cdata in data["cuisines"].items():
            direction = "undervalued" if cdata["bias_score"] < 0 else "overvalued"
            print(f"  {cuisine}: avg_sentiment={cdata['avg_sentiment']}, "
                  f"bias={cdata['bias_score']:+.4f} ({direction}), "
                  f"reviews={cdata['num_reviews']}")


if __name__ == "__main__":
    main()