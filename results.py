import json

with open("bias-server/data/averages.json") as f:
    averages = json.load(f)

with open("bias-server/data/top_words.json") as f:
    top_words = json.load(f)

with open("bias-server/data/sample_reviews.json") as f:
    sample_reviews = json.load(f)

# === Bias Scores by Cuisine and City ===
print("=" * 70)
print("BIAS SCORES BY CUISINE AND CITY")
print("=" * 70)

all_pairs = []
for city, data in averages.items():
    city_avg = data["city_avg_sentiment"]
    print(f"\n{city} — city avg sentiment: {city_avg:.4f}")
    for cuisine, stats in data["cuisines"].items():
        bias = stats["bias_score"]
        direction = "undervalued" if bias < 0 else "overvalued"
        print(f"  {cuisine:10s}: avg_sentiment={stats['avg_sentiment']:.4f}  "
              f"bias={bias:+.4f} ({direction})  reviews={stats['num_reviews']}")
        all_pairs.append((city, cuisine, bias, stats))

# Find extremes
all_pairs.sort(key=lambda x: x[2])
most_undervalued = all_pairs[0]
most_overvalued = all_pairs[-1]
print(f"\nMost undervalued: {most_undervalued[1]} in {most_undervalued[0]} (bias={most_undervalued[2]:+.4f})")
print(f"Most overvalued:  {most_overvalued[1]} in {most_overvalued[0]} (bias={most_overvalued[2]:+.4f})")
print(f"Bias range: {most_undervalued[2]:+.4f} to {most_overvalued[2]:+.4f}")

# City variance
print("\nBias variance by city:")
for city, data in averages.items():
    scores = [s["bias_score"] for s in data["cuisines"].values()]
    variance = sum((s - sum(scores)/len(scores))**2 for s in scores) / len(scores)
    print(f"  {city}: variance={variance:.6f}")

# === Rating Adjustments ===
print("\n" + "=" * 70)
print("RATING ADJUSTMENTS")
print("=" * 70)

max_adj = (None, None, None, 0)
for city, data in averages.items():
    for cuisine, stats in data["cuisines"].items():
        for biz_id, biz in stats["businesses"].items():
            diff = abs(biz["adjusted_rating"] - biz["original_rating"])
            if diff > max_adj[3]:
                max_adj = (city, cuisine, biz_id, diff, biz["original_rating"], biz["adjusted_rating"])

print(f"\nLargest single-business adjustment: {max_adj[3]:.2f} stars")
print(f"  {max_adj[1]} in {max_adj[0]} (business {max_adj[2]})")
print(f"  Original: {max_adj[4]:.2f} → Adjusted: {max_adj[5]:.2f}")

# === TF-IDF Linguistic Signatures ===
print("\n" + "=" * 70)
print("TF-IDF LINGUISTIC SIGNATURES")
print("=" * 70)

for cuisine, words in top_words.items():
    print(f"\n  {cuisine}: {', '.join(words)}")

# === Illustrative Review Examples ===
print("\n" + "=" * 70)
print("ILLUSTRATIVE REVIEW EXAMPLES (largest star-sentiment gaps)")
print("=" * 70)

for city, city_reviews in sample_reviews.items():
    for cuisine, reviews in city_reviews.items():
        if not reviews:
            continue
        # Show the most extreme review per cuisine/city
        review = reviews[0]
        star_norm = (review["stars"] - 1) / 4
        gap = abs(star_norm - review["sentiment"])
        print(f"\n  [{city} / {cuisine}] Stars: {review['stars']} | Sentiment: {review['sentiment']:.4f} | Gap: {gap:.4f}")
        print(f"  \"{review['text'][:200]}...\"")

# === Summary Stats for Paper ===
print("\n" + "=" * 70)
print("SUMMARY STATS FOR PAPER")
print("=" * 70)

total_reviews = sum(
    stats["num_reviews"]
    for data in averages.values()
    for stats in data["cuisines"].values()
)
total_businesses = sum(
    len(stats["businesses"])
    for data in averages.values()
    for stats in data["cuisines"].values()
)
print(f"\nTotal reviews scored: {total_reviews}")
print(f"Total businesses: {total_businesses}")
print(f"Cities: {', '.join(averages.keys())}")
print(f"Cuisines: {', '.join(top_words.keys())}")
