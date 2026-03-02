'use client';

import { useState, useEffect } from 'react';

interface Stats {
  totalItems: number;
  totalVideos: number;
  totalCategories: number;
}

export default function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [itemsRes, catsRes] = await Promise.all([
          fetch('/api/tech-items?groupBy=video'),
          fetch('/api/categories'),
        ]);
        const itemsData = await itemsRes.json();
        const catsData = await catsRes.json();

        const groups = itemsData.groups ?? [];
        const totalItems = groups.reduce((sum: number, g: { items: unknown[] }) => sum + g.items.length, 0);

        setStats({
          totalItems,
          totalVideos: groups.length,
          totalCategories: catsData.categories?.length ?? 0,
        });
      } catch {
        // silently fail
      }
    }
    fetchStats();
  }, []);

  if (!stats) return null;

  return (
    <div className="mt-4 flex gap-4 sm:gap-6">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
        </span>
        <span><strong className="font-semibold text-gray-900">{stats.totalItems}</strong> 기술</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
            <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="white" />
          </svg>
        </span>
        <span><strong className="font-semibold text-gray-900">{stats.totalVideos}</strong> 영상</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
          </svg>
        </span>
        <span><strong className="font-semibold text-gray-900">{stats.totalCategories}</strong> 카테고리</span>
      </div>
    </div>
  );
}
