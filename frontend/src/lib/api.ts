const BIAS_SERVER =
  process.env.NEXT_PUBLIC_BIAS_SERVER_URL ?? 'http://localhost:9000';

export interface BiasData {
  city: string;
  cuisine: string;
  city_avg_sentiment: number;
  cuisine_avg_sentiment: number;
  bias_score: number;
  num_reviews: number;
  explanation: string;
  top_words: string[];
}

export interface BusinessData {
  business_id: string;
  original_rating: number;
  adjusted_rating: number;
  avg_sentiment: number;
  review_count: number;
}

export interface CuisineDetail {
  bias: BiasData;
  businesses: BusinessData[];
}

export async function fetchCities(): Promise<string[]> {
  const res = await fetch(`${BIAS_SERVER}/cities`);
  if (!res.ok) throw new Error('Failed to fetch cities');
  return res.json();
}

export async function fetchCuisines(): Promise<string[]> {
  const res = await fetch(`${BIAS_SERVER}/cuisines`);
  if (!res.ok) throw new Error('Failed to fetch cuisines');
  return res.json();
}

export async function fetchBias(
  city: string,
  cuisine: string
): Promise<CuisineDetail> {
  const res = await fetch(
    `${BIAS_SERVER}/bias/${encodeURIComponent(city)}/${encodeURIComponent(cuisine)}`
  );
  if (!res.ok) throw new Error(`No data for ${cuisine} in ${city}`);
  return res.json();
}

export async function fetchTopWords(): Promise<Record<string, string[]>> {
  const res = await fetch(`${BIAS_SERVER}/top_words`);
  if (!res.ok) throw new Error('Failed to fetch top words');
  return res.json();
}
