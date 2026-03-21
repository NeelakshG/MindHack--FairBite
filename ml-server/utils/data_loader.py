import pandas as pd
import json
import os

CITIES = ["Las Vegas", "Phoenix", "Toronto"]
CUISINES = ["Mexican", "French", "Chinese", "Italian", "Japanese"]

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_BUSINESS_PATH = os.path.join(BASE_DIR, "data", "business.json")
DEFAULT_REVIEW_PATH = os.path.join(BASE_DIR, "data", "review.json")

class YelpDataLoader:
    def __init__(self, business_path: str = DEFAULT_BUSINESS_PATH, review_path: str = DEFAULT_REVIEW_PATH):
        self.business_path = business_path
        self.review_path = review_path

    def load_businesses(self) -> pd.DataFrame:
        records = []
        with open(self.business_path) as f:
            for line in f:
                b = json.loads(line)
                if not b.get("categories"):
                    continue
                if "Restaurants" not in b["categories"]:
                    continue
                if b["city"].strip().title() not in CITIES:
                    continue
                cuisine = self._extract_cuisine(b["categories"])
                if not cuisine:
                    continue
                records.append({
                    "business_id": b["business_id"],
                    "name": b["name"],
                    "city": b["city"].strip().title(),
                    "cuisine": cuisine,
                    "stars": b["stars"],
                    "review_count": b["review_count"]
                })
        return pd.DataFrame(records)

    def load_reviews(self, business_ids: set) -> pd.DataFrame:
        records = []
        with open(self.review_path) as f:
            for line in f:
                r = json.loads(line)
                if r["business_id"] not in business_ids:
                    continue
                records.append({
                    "review_id": r["review_id"],
                    "business_id": r["business_id"],
                    "text": r["text"],
                    "stars": r["stars"]
                })
        return pd.DataFrame(records)

    def _extract_cuisine(self, categories_str: str) -> str | None:
        for cat in categories_str.split(", "):
            if cat in CUISINES:
                return cat
        return None