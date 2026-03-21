"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Nav() {
  const path = usePathname();

  const links = [
    { href: '/', label: 'Search' },
    { href: '/compare', label: 'Compare Cities' },
    { href: '/compare-cuisines', label: 'Compare Cuisines' },
  ];

  return (
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg">⚖️</span>
            <span className="font-semibold text-[#1F2937] tracking-tight">FairBite</span>
          </Link>
          <nav className="flex items-center gap-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  path === href
                    ? 'bg-[#EFF6FF] text-[#2563EB] font-medium'
                    : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-gray-100'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <span className="text-xs text-[#6B7280] bg-gray-100 px-2.5 py-1 rounded-full">
          Bias-Aware Ratings
        </span>
      </div>
    </header>
  );
}
