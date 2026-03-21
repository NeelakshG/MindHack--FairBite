"use client";

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Nav } from '../components/Nav';
import { fetchCities, fetchCuisines, fetchBias, type CuisineDetail } from '@/lib/api';

interface CuisineResult {
  cuisine: string;
  data: CuisineDetail | null;
  error: boolean;
}

function BiasBar({ value, max = 0.15 }: { value: number; max?: number }) {
  const pct = Math.min(Math.abs(value) / max, 1) * 100;
  const color = value < -0.01 ? '#DC2626' : value > 0.01 ? '#16A34A' : '#F59E0B';
  const direction = value > 0 ? 'right' : 'left';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex justify-end">
        {direction === 'left' && (
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
        )}
      </div>
      <div className="w-px h-4 bg-gray-300 shrink-0" />
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        {direction === 'right' && (
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
        )}
      </div>
    </div>
  );
}

function CuisineCard({ cuisine, data, loading }: { cuisine: string; data: CuisineDetail | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-[#F8F9FB] rounded-2xl border border-gray-100 p-6 animate-pulse space-y-3">
        <div className="h-5 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#F8F9FB] rounded-2xl border border-gray-100 p-6 flex items-center justify-center text-sm text-[#9CA3AF]">
        No data for this cuisine
      </div>
    );
  }

  const { bias } = data;
  const biasScore = bias.bias_score;

  const label =
    biasScore < -0.01
      ? { text: 'Undervalued', color: 'text-[#DC2626] bg-[#FEE2E2]' }
      : biasScore > 0.01
      ? { text: 'Overvalued', color: 'text-[#16A34A] bg-[#DCFCE7]' }
      : { text: 'Neutral', color: 'text-[#92400E] bg-[#FEF3C7]' };

  const avgOriginal =
    data.businesses.reduce((s, b) => s + b.original_rating, 0) / (data.businesses.length || 1);
  const avgAdjusted =
    data.businesses.reduce((s, b) => s + b.adjusted_rating, 0) / (data.businesses.length || 1);
  const diff = avgAdjusted - avgOriginal;

  return (
    <div className="bg-[#F8F9FB] rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-[#1F2937]">{cuisine}</h3>
          <p className="text-xs text-[#9CA3AF] mt-0.5">{bias.num_reviews} reviews</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${label.color}`}>
          {label.text}
        </span>
      </div>

      <div className="mx-6 border-t border-gray-200" />

      <div className="px-6 py-4 space-y-4">
        {/* Bias score */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#6B7280] mb-2">
            <span>Bias score</span>
            <span className={`font-semibold ${biasScore > 0.01 ? 'text-[#16A34A]' : biasScore < -0.01 ? 'text-[#DC2626]' : 'text-[#F59E0B]'}`}>
              {biasScore >= 0 ? '+' : ''}{biasScore.toFixed(4)}
            </span>
          </div>
          <BiasBar value={biasScore} />
          <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-1">
            <span>undervalued</span>
            <span>overvalued</span>
          </div>
        </div>

        {/* Sentiment vs city avg */}
        <div className="space-y-1.5">
          <p className="text-xs text-[#6B7280] mb-2">Sentiment vs city avg</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-24 text-[#6B7280] shrink-0">{cuisine}</span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${bias.cuisine_avg_sentiment * 100}%` }} />
            </div>
            <span className="w-8 text-right text-[#1F2937] font-medium">{bias.cuisine_avg_sentiment.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-24 text-[#6B7280] shrink-0">City avg</span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gray-400 rounded-full" style={{ width: `${bias.city_avg_sentiment * 100}%` }} />
            </div>
            <span className="w-8 text-right text-[#6B7280]">{bias.city_avg_sentiment.toFixed(2)}</span>
          </div>
        </div>

        {/* Rating adjustment */}
        <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100">
          <div className="text-center">
            <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">Avg Rating</p>
            <p className="text-lg font-semibold text-[#1F2937]">{avgOriginal.toFixed(2)}</p>
          </div>
          <div className="text-[#9CA3AF] text-lg">→</div>
          <div className="text-center">
            <p className="text-[10px] text-[#16A34A] uppercase tracking-wider mb-1">Fair Rating</p>
            <p className="text-lg font-semibold text-[#16A34A]">
              {avgAdjusted.toFixed(2)}
              <span className="text-xs ml-1">({diff >= 0 ? '+' : ''}{diff.toFixed(2)})</span>
            </p>
          </div>
        </div>

        {/* Top words */}
        {bias.top_words.length > 0 && (
          <div>
            <p className="text-xs text-[#6B7280] mb-2">Top words in reviews</p>
            <div className="flex flex-wrap gap-1.5">
              {bias.top_words.slice(0, 6).map((w) => (
                <span key={w} className="text-xs text-[#1D4ED8] bg-[#DBEAFE] px-2 py-0.5 rounded-full">
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompareCuisinesPage() {
  const [cities, setCities] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [results, setResults] = useState<CuisineResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [serverDown, setServerDown] = useState(false);

  useEffect(() => {
    Promise.all([fetchCities(), fetchCuisines()])
      .then(([c, cu]) => {
        setCities(c);
        setCuisines(cu);
      })
      .catch(() => setServerDown(true));
  }, []);

  const handleCityChange = async (city: string) => {
    setSelectedCity(city);
    if (!city) return;

    setLoading(true);
    setResults(cuisines.map((cuisine) => ({ cuisine, data: null, error: false })));

    const fetched = await Promise.all(
      cuisines.map((cuisine) =>
        fetchBias(city, cuisine)
          .then((data) => ({ cuisine, data, error: false }))
          .catch(() => ({ cuisine, data: null, error: true }))
      )
    );

    // Sort by bias score ascending (most undervalued first)
    fetched.sort((a, b) => (a.data?.bias.bias_score ?? 0) - (b.data?.bias.bias_score ?? 0));
    setResults(fetched);
    setLoading(false);
  };

  const withData = results.filter((r) => r.data);
  const undervalued = withData.filter((r) => (r.data!.bias.bias_score ?? 0) < -0.01).length;
  const overvalued = withData.filter((r) => (r.data!.bias.bias_score ?? 0) > 0.01).length;
  const neutral = withData.length - undervalued - overvalued;

  // Most biased cuisine for callout
  const mostBiased = withData.sort((a, b) =>
    Math.abs(b.data!.bias.bias_score) - Math.abs(a.data!.bias.bias_score)
  )[0];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Nav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-[#1F2937] tracking-tight mb-1">
              Cuisine Comparison
            </h1>
            <p className="text-[#6B7280]">
              See which cuisines are most affected by bias within a single city.
            </p>
          </div>

          {!serverDown && (
            <div className="relative shrink-0">
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="appearance-none py-2.5 pl-4 pr-10 text-sm text-[#1F2937] bg-white
                           border border-gray-200 rounded-xl shadow-sm focus:outline-none
                           focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all min-w-48"
              >
                <option value="">Select city…</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#9CA3AF]" />
            </div>
          )}
        </div>

        {serverDown && (
          <div className="flex items-center gap-2 text-sm text-[#DC2626] bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <span>⚠️</span>
            <span>Bias server is offline. Start it with <code className="font-mono bg-red-100 px-1 rounded">uvicorn app:app --port 9000</code> inside <code className="font-mono bg-red-100 px-1 rounded">bias-server/</code>.</span>
          </div>
        )}

        {/* Summary */}
        {selectedCity && withData.length > 0 && (
          <div className="flex items-center gap-6 bg-[#F8F9FB] rounded-2xl border border-gray-100 px-6 py-4">
            <div>
              <p className="text-sm font-medium text-[#1F2937]">
                <span className="font-semibold">{selectedCity}</span> — {withData.length} cuisines analyzed
              </p>
              {mostBiased && (
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Most affected: <span className="font-medium text-[#1F2937]">{mostBiased.cuisine}</span>{' '}
                  (bias {mostBiased.data!.bias.bias_score >= 0 ? '+' : ''}{mostBiased.data!.bias.bias_score.toFixed(4)})
                </p>
              )}
            </div>
            <div className="flex gap-3 ml-auto">
              {undervalued > 0 && (
                <span className="text-xs font-medium text-[#DC2626] bg-[#FEE2E2] px-3 py-1 rounded-full">
                  {undervalued} undervalued
                </span>
              )}
              {overvalued > 0 && (
                <span className="text-xs font-medium text-[#16A34A] bg-[#DCFCE7] px-3 py-1 rounded-full">
                  {overvalued} overvalued
                </span>
              )}
              {neutral > 0 && (
                <span className="text-xs font-medium text-[#92400E] bg-[#FEF3C7] px-3 py-1 rounded-full">
                  {neutral} neutral
                </span>
              )}
            </div>
          </div>
        )}

        {/* Cuisine grid — sorted by bias score */}
        {(loading || results.length > 0) && (
          <div className={`grid gap-5 ${cuisines.length <= 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {results.map((item) => (
              <CuisineCard
                key={item.cuisine}
                cuisine={item.cuisine}
                data={item.data}
                loading={loading && !item.data}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!selectedCity && !serverDown && (
          <div className="text-center py-24 text-[#9CA3AF]">
            <p className="text-5xl mb-4">🍜</p>
            <p className="text-lg font-medium text-[#6B7280]">Select a city to compare cuisines</p>
            <p className="text-sm mt-1">See which cuisines are most affected by bias in that city.</p>
          </div>
        )}
      </main>
    </div>
  );
}
