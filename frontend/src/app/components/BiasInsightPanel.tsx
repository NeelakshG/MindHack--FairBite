"use client";

interface BiasInsightPanelProps {
  cuisineSentiment: number;
  cityAverage: number;
  cuisineWords: string[];
  otherWords: string[];
  insight: string;
}

function SentimentBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color =
    value >= 0.7 ? '#16A34A' : value >= 0.5 ? '#F59E0B' : '#DC2626';
  const emoji = value >= 0.7 ? '😊' : value >= 0.5 ? '😐' : '😕';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#6B7280]">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-[#1F2937]">{value.toFixed(2)}</span>
          <span>{emoji}</span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function BiasInsightPanel({
  cuisineSentiment,
  cityAverage,
  cuisineWords,
  otherWords,
  insight,
}: BiasInsightPanelProps) {
  return (
    <div className="w-full bg-[#F8F9FB] rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Panel title */}
      <div className="px-7 pt-6 pb-5">
        <h3 className="text-base font-semibold text-[#1F2937]">Bias Analysis</h3>
        <p className="text-xs text-[#9CA3AF] mt-0.5">
          How this cuisine's reviews compare to the city average
        </p>
      </div>

      <div className="mx-7 border-t border-gray-200" />

      {/* Section A: Sentiment */}
      <div className="px-7 py-5 space-y-4">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
          Sentiment Score
        </p>
        <SentimentBar label="This cuisine" value={cuisineSentiment} />
        <SentimentBar label="City average" value={cityAverage} />

        {/* Gap callout */}
        {cityAverage > cuisineSentiment && (
          <div className="flex items-center gap-2 text-xs text-[#F59E0B] bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-4 py-2.5">
            <span>⚠️</span>
            <span>
              Sentiment gap of{' '}
              <span className="font-semibold">{(cityAverage - cuisineSentiment).toFixed(2)}</span>{' '}
              detected — this cuisine is scored lower than average.
            </span>
          </div>
        )}
      </div>

      <div className="mx-7 border-t border-gray-200" />

      {/* Section B: Language patterns */}
      <div className="px-7 py-5">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4">
          Language Patterns
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-medium text-[#6B7280] mb-3">Your Cuisine</p>
            <div className="flex flex-wrap gap-2">
              {cuisineWords.map((word) => (
                <span
                  key={word}
                  className="text-xs text-[#92400E] bg-[#FEF3C7] border border-[#FDE68A] px-2.5 py-1 rounded-full"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-medium text-[#6B7280] mb-3">Other Cuisines</p>
            <div className="flex flex-wrap gap-2">
              {otherWords.map((word) => (
                <span
                  key={word}
                  className="text-xs text-[#1D4ED8] bg-[#DBEAFE] border border-[#BFDBFE] px-2.5 py-1 rounded-full"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-7 border-t border-gray-200" />

      {/* Section C: Insight */}
      <div className="px-7 py-5">
        <div className="flex gap-3 bg-white rounded-xl px-5 py-4 border-l-4 border-[#2563EB] border border-gray-100">
          <span className="text-lg shrink-0">💡</span>
          <p className="text-sm text-[#1F2937] leading-relaxed">{insight}</p>
        </div>
      </div>
    </div>
  );
}
