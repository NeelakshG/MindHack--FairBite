from fastapi import APIRouter, HTTPException

from api.schemas import (
    BiasResponse,
    BusinessResponse,
    CuisineDetailResponse,
    CityOverviewResponse,
    CityOverviewCuisine,
    ReviewSample,
)
from bias.scoring import load_averages, load_top_words, load_sample_reviews, get_bias_for_cuisine, get_businesses_for_cuisine
from bias.explanation import explain_bias

router = APIRouter()

# Load precomputed data once at import time
averages = load_averages()
top_words = load_top_words()
sample_reviews = load_sample_reviews()


@router.get("/cities")
def list_cities():
    return list(averages.keys())


@router.get("/cuisines")
def list_cuisines():
    return list(top_words.keys())


@router.get("/city/{city}", response_model=CityOverviewResponse)
def city_overview(city: str):
    city_data = averages.get(city)
    if not city_data:
        raise HTTPException(status_code=404, detail=f"City '{city}' not found")

    cuisines = []
    for cuisine, cdata in city_data["cuisines"].items():
        cuisines.append(CityOverviewCuisine(
            cuisine=cuisine,
            avg_sentiment=cdata["avg_sentiment"],
            bias_score=cdata["bias_score"],
            num_reviews=cdata["num_reviews"],
        ))

    return CityOverviewResponse(
        city=city,
        city_avg_sentiment=city_data["city_avg_sentiment"],
        cuisines=cuisines,
    )


@router.get("/bias/{city}/{cuisine}", response_model=CuisineDetailResponse)
def cuisine_bias(city: str, cuisine: str):
    bias_data = get_bias_for_cuisine(city, cuisine, averages)
    if not bias_data:
        raise HTTPException(status_code=404, detail=f"No data for {cuisine} in {city}")

    cuisine_words = top_words.get(cuisine, [])
    explanation = explain_bias(city, cuisine, bias_data["bias_score"], cuisine_words)

    bias = BiasResponse(
        **bias_data,
        explanation=explanation,
        top_words=cuisine_words,
    )

    businesses_data = get_businesses_for_cuisine(city, cuisine, averages) or []
    businesses = [BusinessResponse(**b) for b in businesses_data]

    return CuisineDetailResponse(bias=bias, businesses=businesses)


@router.get("/reviews/{city}/{cuisine}", response_model=list[ReviewSample])
def get_reviews(city: str, cuisine: str):
    reviews = sample_reviews.get(city, {}).get(cuisine)
    if not reviews:
        raise HTTPException(status_code=404, detail=f"No reviews for {cuisine} in {city}")
    return reviews


@router.get("/top_words")
def get_top_words():
    return top_words
