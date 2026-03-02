'use client';

import { useState } from 'react';

interface ExtractFormProps {
  onSubmit: (urls: string[]) => void;
  loading: boolean;
}

export default function ExtractForm({ onSubmit, loading }: ExtractFormProps) {
  const [urlInput, setUrlInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urls = urlInput
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
    if (urls.length === 0) return;
    onSubmit(urls);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          YouTube 영상 URL (줄바꿈으로 여러 URL 입력 가능)
        </label>
        <textarea
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          rows={4}
          placeholder={"https://youtube.com/watch?v=abc\nhttps://youtube.com/watch?v=def"}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={loading}
        />
      </div>
      <button
        type="submit"
        disabled={loading || !urlInput.trim()}
        className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? '분석 중...' : '자막 추출 및 분석'}
      </button>
    </form>
  );
}
