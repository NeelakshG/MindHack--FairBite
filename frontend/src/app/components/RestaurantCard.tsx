"use client";

interface RestaurantCardProps {
  name: string;
  city: string;
  numReviews: number;
  originalRating: number;
  fairRating: number;
}

export function RestaurantCard({
  name,
  city,
  numReviews,
  originalRating,
  fairRating,
}: RestaurantCardProps) {
  const difference = fairRating - originalRating;
  const isUndervalued = difference > 0.01;
  const isOvervalued = difference < -0.01;

  const biasLabel = isUndervalued
    ? { text: 'Undervalued due to bias', color: 'text-[#16A34A] bg-[#DCFCE7]' }
    : isOvervalued
    ? { text: 'Overvalued due to bias', color: 'text-[#DC2626] bg-[#FEE2E2]' }
    : { text: 'Ratings appear fair', color: 'text-[#6B7280] bg-gray-100' };

  return (
    <div className="w-full bg-[#F8F9FB] rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-7 pt-7 pb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#1F2937] mb-1">{name} Restaurants</h2>
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <span>{city}</span>
            <span className="text-gray-300">•</span>
            <span>{numReviews} reviews analyzed</span>
          </div>
        </div>
        <span className={`shrink-0 text-xs font-medium px-3 py-1 rounded-full ${biasLabel.color}`}>
          {biasLabel.text}
        </span>
      </div>

      <div className="mx-7 border-t border-gray-200" />

      {/* Rating cards */}
      <div className="px-7 py-5 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl px-5 py-4 border border-gray-100">
          <p className="text-xs text-[#9CA3AF] mb-2 font-medium uppercase tracking-wider">
            Avg Original Rating
          </p>
          <div className="flex items-end gap-1.5">
            <span className="text-lg leading-none">⭐</span>
            <span className="text-2xl font-semibold text-[#1F2937] leading-none">
              {originalRating.toFixed(2)}
            </span>
            <span className="text-xs text-[#9CA3AF] mb-0.5">/ 5</span>
          </div>
        </div>

        <div className="bg-white rounded-xl px-5 py-4 border border-[#BBF7D0]">
          <p className="text-xs text-[#16A34A] mb-2 font-medium uppercase tracking-wider">
            Avg Fair Rating
          </p>
          <div className="flex items-end gap-1.5">
            <span className="text-lg leading-none">⚖️</span>
            <span className="text-2xl font-semibold text-[#16A34A] leading-none">
              {fairRating.toFixed(2)}
            </span>
            <span className="text-xs text-[#9CA3AF] mb-0.5">/ 5</span>
            <span className="ml-auto text-sm font-semibold text-[#16A34A] mb-0.5">
              {difference >= 0 ? '+' : ''}{difference.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bars */}
      <div className="px-7 pb-7 space-y-2">
        <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
          <span className="w-28 shrink-0">Original</span>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-400 rounded-full"
              style={{ width: `${(originalRating / 5) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right">{originalRating.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#16A34A]">
          <span className="w-28 shrink-0 font-medium">Fair (adjusted)</span>
          <div className="flex-1 h-2 bg-[#DCFCE7] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#16A34A] rounded-full"
              style={{ width: `${(fairRating / 5) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right font-medium">{fairRating.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
