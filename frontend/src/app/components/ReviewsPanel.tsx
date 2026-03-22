"use client";

import { type ReviewSample } from '@/lib/api';

interface ReviewsPanelProps {
  reviews: ReviewSample[];
  cuisine: string;
  city: string;
}

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= stars ? 'text-[#F59E0B]' : 'text-gray-200'}>
          ★
        </span>
      ))}
    </div>
  );
}

function SentimentChip({ value }: { value: number }) {
  const color =
    value >= 0.7
      ? 'text-[#16A34A] bg-[#DCFCE7] border-[#BBF7D0]'
      : value >= 0.4
      ? 'text-[#92400E] bg-[#FEF3C7] border-[#FDE68A]'
      : 'text-[#DC2626] bg-[#FEE2E2] border-[#FECACA]';
  const label = value >= 0.7 ? 'Positive' : value >= 0.4 ? 'Neutral' : 'Negative';
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${color}`}>
      {label} · {value.toFixed(2)}
    </span>
  );
}

function GapBadge({ stars, sentiment }: { stars: number; sentiment: number }) {
  const starNorm = (stars - 1) / 4;
  const gap = starNorm - sentiment;
  if (Math.abs(gap) < 0.1) return null;
  const isOverrated = gap > 0;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
      isOverrated
        ? 'text-[#DC2626] bg-[#FEE2E2] border-[#FECACA]'
        : 'text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]'
    }`}>
      {isOverrated ? '⚠ Stars exceed sentiment' : '↑ Sentiment exceeds stars'}
    </span>
  );
}

export function ReviewsPanel({ reviews, cuisine, city }: ReviewsPanelProps) {
  if (!reviews.length) return null;

  return (
    <div className="w-full bg-[#F8F9FB] rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-7 pt-6 pb-5">
        <h3 className="text-base font-semibold text-[#1F2937]">Real Reviews</h3>
        <p className="text-xs text-[#9CA3AF] mt-0.5">
          Most illustrative {cuisine} reviews in {city} — showing where star ratings and sentiment diverge
        </p>
      </div>

      <div className="mx-7 border-t border-gray-200" />

      <div className="px-7 py-5 space-y-4">
        {reviews.map((review, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <StarRating stars={review.stars} />
              <div className="flex items-center gap-2 flex-wrap">
                <SentimentChip value={review.sentiment} />
                <GapBadge stars={review.stars} sentiment={review.sentiment} />
              </div>
            </div>

            {/* Review text */}
            <p className="text-sm text-[#374151] leading-relaxed">{review.text}</p>

            {/* Visual sentiment bar */}
            <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
              <span className="w-20 shrink-0">Sentiment</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${review.sentiment * 100}%`,
                    backgroundColor:
                      review.sentiment >= 0.7 ? '#16A34A'
                      : review.sentiment >= 0.4 ? '#F59E0B'
                      : '#DC2626',
                  }}
                />
              </div>
              <span className="w-8 text-right">{review.sentiment.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
