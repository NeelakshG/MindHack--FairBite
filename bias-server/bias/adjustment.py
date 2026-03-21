ALPHA = 0.5


def adjust_rating(original_rating: float, bias_score: float) -> float:
    adjusted = original_rating + ALPHA * bias_score
    return round(max(1.0, min(5.0, adjusted)), 2)
