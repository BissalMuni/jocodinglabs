'use client';

import { useState, useCallback } from 'react';
import type { PracticeStatus } from '@/types';
import { getPracticeData, setPracticeStatus, setPracticeMemo } from '@/lib/local-storage';

interface PracticeTrackerProps {
  techItemId: number;
}

const STATUS_LABELS: Record<PracticeStatus, string> = {
  not_started: '미시작',
  in_progress: '진행중',
  completed: '완료',
};

const STATUS_COLORS: Record<PracticeStatus, string> = {
  not_started: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
};

export default function PracticeTracker({ techItemId }: PracticeTrackerProps) {
  const [data, setData] = useState(() => getPracticeData(techItemId));
  const [showMemo, setShowMemo] = useState(false);

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStatus = e.target.value as PracticeStatus;
      setPracticeStatus(techItemId, newStatus);
      setData((prev) => ({ ...prev, status: newStatus }));
    },
    [techItemId],
  );

  const handleMemoChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const memo = e.target.value;
      setPracticeMemo(techItemId, memo);
      setData((prev) => ({ ...prev, memo }));
    },
    [techItemId],
  );

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <div className="flex items-center gap-2">
        <select
          value={data.status}
          onChange={handleStatusChange}
          className={`rounded-md px-2 py-1 text-xs font-medium ${STATUS_COLORS[data.status]}`}
        >
          {(Object.entries(STATUS_LABELS) as [PracticeStatus, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowMemo(!showMemo)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {showMemo ? '메모 닫기' : data.memo ? '메모 보기' : '메모 추가'}
        </button>
      </div>
      {showMemo && (
        <textarea
          value={data.memo}
          onChange={handleMemoChange}
          placeholder="실습 메모를 입력하세요..."
          className="mt-2 w-full rounded-md border border-gray-200 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={2}
        />
      )}
    </div>
  );
}
