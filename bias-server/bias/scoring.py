import json
import os
from config import DATA_DIR


def load_averages() -> dict:
    with open(os.path.join(DATA_DIR, "averages.json")) as f:
        return json.load(f)


def load_top_words() -> dict:
    with open(os.path.join(DATA_DIR, "top_words.json")) as f:
        return json.load(f)


def load_sample_reviews() -> dict:
    path = os.path.join(DATA_DIR, "sample_reviews.json")
    if not os.path.exists(path):
        return {}
    with open(path) as f:
        return json.load(f)


def get_bias_for_cuisine(city: str, cuisine: str, averages: dict) -> dict | None:
    city_data = averages.get(city)
    if not city_data:
        return None
    cuisine_data = city_data["cuisines"].get(cuisine)
    if not cuisine_data:
        return None
    return {
        "city": city,
        "cuisine": cuisine,
        "city_avg_sentiment": city_data["city_avg_sentiment"],
        "cuisine_avg_sentiment": cuisine_data["avg_sentiment"],
        "bias_score": cuisine_data["bias_score"],
        "num_reviews": cuisine_data["num_reviews"],
    }


def get_businesses_for_cuisine(city: str, cuisine: str, averages: dict) -> list | None:
    city_data = averages.get(city)
    if not city_data:
        return None
    cuisine_data = city_data["cuisines"].get(cuisine)
    if not cuisine_data:
        return None

    businesses = []
    for biz_id, biz_data in cuisine_data.get("businesses", {}).items():
        businesses.append({
            "business_id": biz_id,
            **biz_data
        })
    return sorted(businesses, key=lambda b: b["adjusted_rating"], reverse=True)