"use client";

import { type FormEvent } from 'react';
import { ChevronDown } from 'lucide-react';

interface SearchBarProps {
  cities: string[];
  cuisines: string[];
  loading: boolean;
  onAnalyze: (city: string, cuisine: string) => void;
}

export function SearchBar({ cities, cuisines, loading, onAnalyze }: SearchBarProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const city = data.get('city') as string;
    const cuisine = data.get('cuisine') as string;
    if (city && cuisine) onAnalyze(city, cuisine);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <div className="flex gap-3">
        {/* City */}
        <div className="relative flex-1">
          <select
            name="city"
            defaultValue=""
            required
            className="w-full appearance-none py-3 pl-4 pr-10 text-sm text-[#1F2937] bg-white
                       border border-gray-200 rounded-xl shadow-sm focus:outline-none
                       focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
          >
            <option value="" disabled>Select city…</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#9CA3AF]" />
        </div>

        {/* Cuisine */}
        <div className="relative flex-1">
          <select
            name="cuisine"
            defaultValue=""
            required
            className="w-full appearance-none py-3 pl-4 pr-10 text-sm text-[#1F2937] bg-white
                       border border-gray-200 rounded-xl shadow-sm focus:outline-none
                       focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
          >
            <option value="" disabled>Select cuisine…</option>
            {cuisines.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#9CA3AF]" />
        </div>

        {/* Analyze */}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60
                     text-white text-sm font-medium rounded-xl shadow-sm transition-colors whitespace-nowrap"
        >
          {loading ? 'Loading…' : 'Analyze Bias'}
        </button>
      </div>
    </form>
  );
}
