"use client";

import { useState, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { RestaurantCard } from './components/RestaurantCard';
import { BiasInsightPanel } from './components/BiasInsightPanel';
import {
  fetchCities,
  fetchCuisines,
  fetchBias,
  fetchTopWords,
  type CuisineDetail,
} from '@/lib/api';
import { Nav } from './components/Nav';

function avg(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export default function App() {
  const [cities, setCities] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [allTopWords, setAllTopWords] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<CuisineDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverDown, setServerDown] = useState(false);

  useEffect(() => {
    Promise.all([fetchCities(), fetchCuisines(), fetchTopWords()])
      .then(([c, cu, tw]) => {
        setCities(c);
        setCuisines(cu);
        setAllTopWords(tw);
      })
      .catch(() => setServerDown(true));
  }, []);

  const handleAnalyze = async (city: string, cuisine: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBias(city, cuisine);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Derived display values from API result
  const displayData = result
    ? {
        name: result.bias.cuisine,
        city: result.bias.city,
        numReviews: result.bias.num_reviews,
        originalRating: avg(result.businesses.map((b) => b.original_rating)),
        fairRating: avg(result.businesses.map((b) => b.adjusted_rating)),
        cuisineSentiment: result.bias.cuisine_avg_sentiment,
        cityAverage: result.bias.city_avg_sentiment,
        cuisineWords: result.bias.top_words,
        otherWords: [
          ...new Set(
            Object.entries(allTopWords)
              .filter(([k]) => k !== result.bias.cuisine)
              .flatMap(([, words]) => words.slice(0, 2))
          ),
        ].slice(0, 6),
        insight: result.bias.explanation,
      }
    : null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Nav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-10 flex flex-col gap-8">
        {/* Hero + search */}
        <div>
          <h1 className="text-4xl font-semibold text-[#1F2937] tracking-tight mb-2">
            Are ratings fair?
          </h1>
          <p className="text-[#6B7280] mb-6">
            FairBite corrects for cultural and linguistic bias in restaurant reviews.
          </p>

          {serverDown ? (
            <div className="flex items-center gap-2 text-sm text-[#DC2626] bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <span>⚠️</span>
              <span>Bias server is offline. Start it with <code className="font-mono bg-red-100 px-1 rounded">uvicorn app:app --port 9000</code> inside <code className="font-mono bg-red-100 px-1 rounded">bias-server/</code>.</span>
            </div>
          ) : (
            <SearchBar
              cities={cities}
              cuisines={cuisines}
              loading={loading}
              onAnalyze={handleAnalyze}
            />
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm text-[#DC2626] bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Results — two column when panel is visible */}
        {displayData && (
          <div className="grid grid-cols-2 gap-6 animate-in fade-in duration-300">
            <RestaurantCard
              name={displayData.name}
              city={displayData.city}
              numReviews={displayData.numReviews}
              originalRating={displayData.originalRating}
              fairRating={displayData.fairRating}
            />
            <BiasInsightPanel
              cuisineSentiment={displayData.cuisineSentiment}
              cityAverage={displayData.cityAverage}
              cuisineWords={displayData.cuisineWords}
              otherWords={displayData.otherWords}
              insight={displayData.insight}
            />
          </div>
        )}

        <p className="text-xs text-[#9CA3AF]">
          Ratings adjusted using NLP sentiment analysis across 50,000+ reviews.
        </p>
      </main>
    </div>
  );
}
