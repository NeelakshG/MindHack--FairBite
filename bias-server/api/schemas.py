from pydantic import BaseModel


class BiasResponse(BaseModel):
    city: str
    cuisine: str
    city_avg_sentiment: float
    cuisine_avg_sentiment: float
    bias_score: float
    num_reviews: int
    explanation: str
    top_words: list[str]


class BusinessResponse(BaseModel):
    business_id: str
    original_rating: float
    adjusted_rating: float
    avg_sentiment: float
    review_count: int


class CuisineDetailResponse(BaseModel):
    bias: BiasResponse
    businesses: list[BusinessResponse]


class CityOverviewCuisine(BaseModel):
    cuisine: str
    avg_sentiment: float
    bias_score: float
    num_reviews: int


class CityOverviewResponse(BaseModel):
    city: str
    city_avg_sentiment: float
    cuisines: list[CityOverviewCuisine]


class ReviewSample(BaseModel):
    text: str
    stars: int
    sentiment: float
