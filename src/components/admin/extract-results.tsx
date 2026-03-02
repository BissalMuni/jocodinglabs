'use client';

import { useState } from 'react';

interface ExtractedItem {
  name: string;
  description: string;
  url: string;
  suggestedCategory: string;
}

interface VideoResult {
  videoUrl: string;
  videoTitle: string;
  extractedItems: ExtractedItem[];
  error?: string;
}

interface Category {
  id: number;
  name: string;
}

interface ExtractResultsProps {
  results: VideoResult[];
  categories: Category[];
  onConfirm: (items: Array<{
    name: string;
    description: string;
    url: string;
    categoryId: number;
    introducedAt: string;
    sourceVideoUrl: string;
  }>) => void;
  confirming: boolean;
}

export default function ExtractResults({ results, categories, onConfirm, confirming }: ExtractResultsProps) {
  const [editedItems, setEditedItems] = useState(() => {
    const items: Array<{
      name: string;
      description: string;
      url: string;
      categoryId: number;
      introducedAt: string;
      sourceVideoUrl: string;
      selected: boolean;
    }> = [];
    for (const result of results) {
      if (result.error) continue;
      for (const item of result.extractedItems) {
        const matchedCat = categories.find((c) => c.name === item.suggestedCategory);
        items.push({
          name: item.name,
          description: item.description,
          url: item.url || '',
          categoryId: matchedCat?.id || categories[categories.length - 1]?.id || 0,
          introducedAt: new Date().toISOString().split('T')[0],
          sourceVideoUrl: result.videoUrl,
          selected: true,
        });
      }
    }
    return items;
  });

  const updateItem = (index: number, field: string, value: string | number | boolean) => {
    setEditedItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleConfirm = () => {
    const selected = editedItems
      .filter((item) => item.selected)
      .map(({ selected: _, ...rest }) => rest);
    if (selected.length === 0) return;
    onConfirm(selected);
  };

  const errorResults = results.filter((r) => r.error);

  return (
    <div className="space-y-4">
      {errorResults.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-700">일부 영상 처리 실패:</p>
          {errorResults.map((r, i) => (
            <p key={i} className="mt-1 text-xs text-red-600">{r.videoUrl}: {r.error}</p>
          ))}
        </div>
      )}

      {editedItems.length === 0 ? (
        <p className="text-gray-500">추출된 기술이 없습니다</p>
      ) : (
        <>
          <div className="space-y-3">
            {editedItems.map((item, index) => (
              <div key={index} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={(e) => updateItem(index, 'selected', e.target.checked)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm font-medium"
                    />
                    <textarea
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    <input
                      type="url"
                      value={item.url}
                      onChange={(e) => updateItem(index, 'url', e.target.value)}
                      placeholder="홈페이지 URL"
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm text-blue-600"
                    />
                    <div className="flex gap-2">
                      <select
                        value={item.categoryId}
                        onChange={(e) => updateItem(index, 'categoryId', Number(e.target.value))}
                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={item.introducedAt}
                        onChange={(e) => updateItem(index, 'introducedAt', e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-400">출처: {item.sourceVideoUrl}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleConfirm}
            disabled={confirming || editedItems.every((i) => !i.selected)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {confirming ? '저장 중...' : `선택한 ${editedItems.filter((i) => i.selected).length}개 항목 확정`}
          </button>
        </>
      )}
    </div>
  );
}
