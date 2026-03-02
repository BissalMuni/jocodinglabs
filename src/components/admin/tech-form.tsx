'use client';

import { useState } from 'react';

interface Category {
  id: number;
  name: string;
  sortOrder: number;
}

interface TechFormData {
  name: string;
  description: string;
  categoryId: number;
  introducedAt: string;
  sourceVideoUrls: string[];
}

interface TechFormProps {
  categories: Category[];
  initialData?: TechFormData;
  onSave: (data: TechFormData) => void;
  onCancel: () => void;
}

export default function TechForm({ categories, initialData, onSave, onCancel }: TechFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || 0);
  const [introducedAt, setIntroducedAt] = useState(initialData?.introducedAt || new Date().toISOString().split('T')[0]);
  const [videoUrls, setVideoUrls] = useState(initialData?.sourceVideoUrls?.join('\n') || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const urls = videoUrls
        .split('\n')
        .map((u) => u.trim())
        .filter((u) => u.length > 0);
      await onSave({ name, description, categoryId, introducedAt, sourceVideoUrls: urls });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">기술 이름 *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={200}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">설명 *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          maxLength={2000}
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">카테고리 *</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={0} disabled>선택하세요</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">소개 날짜 *</label>
          <input
            type="date"
            value={introducedAt}
            onChange={(e) => setIntroducedAt(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">출처 영상 URL (줄바꿈으로 구분)</label>
        <textarea
          value={videoUrls}
          onChange={(e) => setVideoUrls(e.target.value)}
          rows={2}
          placeholder="https://youtube.com/watch?v=..."
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '저장 중...' : initialData ? '수정' : '추가'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
        >
          취소
        </button>
      </div>
    </form>
  );
}
