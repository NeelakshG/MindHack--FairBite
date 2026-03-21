def explain_bias(city: str, cuisine: str, bias_score: float, top_words: list[str] | None) -> str:
    if bias_score < -0.05:
        direction = "undervalued"
        detail = (f"{cuisine} restaurants in {city} receive lower sentiment scores than the city average, "
                  f"suggesting reviewers use harsher language for this cuisine.")
    elif bias_score > 0.05:
        direction = "overvalued"
        detail = (f"{cuisine} restaurants in {city} receive higher sentiment scores than the city average, "
                  f"suggesting reviewers use more favorable language for this cuisine.")
    else:
        direction = "neutral"
        detail = (f"{cuisine} restaurants in {city} receive sentiment scores close to the city average, "
                  f"suggesting relatively neutral language from reviewers.")

    explanation = f"Bias: {direction} (score: {bias_score:+.4f}). {detail}"

    if top_words:
        explanation += f" Common words in {cuisine} reviews: {', '.join(top_words[:5])}."

    return explanation
