'use client';

import { useState, useCallback, useEffect } from 'react';
import type { PracticeStatus } from '@/types';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onPracticeFilter?: (status: PracticeStatus | 'all') => void;
  showPracticeFilter?: boolean;
  practiceFilter?: PracticeStatus | 'all';
}

export default function SearchBar({ onSearch, onPracticeFilter, showPracticeFilter = false, practiceFilter = 'all' }: SearchBarProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handlePracticeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onPracticeFilter?.(e.target.value as PracticeStatus | 'all');
    },
    [onPracticeFilter],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="기술명 또는 설명으로 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pl-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      {showPracticeFilter && (
        <select
          value={practiceFilter}
          onChange={handlePracticeChange}
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">실습 상태: 전체</option>
          <option value="not_started">미시작</option>
          <option value="in_progress">진행중</option>
          <option value="completed">완료</option>
        </select>
      )}
    </div>
  );
}
