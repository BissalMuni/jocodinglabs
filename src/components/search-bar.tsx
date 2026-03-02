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

  const clearQuery = useCallback(() => {
    setQuery('');
  }, []);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="기술명 또는 설명으로 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pl-10 pr-9 text-sm shadow-sm transition-shadow focus:border-blue-500 focus:shadow-md focus:outline-none focus:ring-1 focus:ring-blue-500"
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
        {query && (
          <button
            onClick={clearQuery}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {showPracticeFilter && (
        <select
          value={practiceFilter}
          onChange={handlePracticeChange}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm transition-shadow focus:border-blue-500 focus:shadow-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">실습: 전체</option>
          <option value="not_started">미시작</option>
          <option value="in_progress">진행중</option>
          <option value="completed">완료</option>
        </select>
      )}
    </div>
  );
}
