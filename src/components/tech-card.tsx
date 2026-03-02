'use client';

import PracticeTracker from './practice-tracker';

interface SourceVideo {
  id: number;
  url: string;
  title: string;
}

interface Category {
  id: number;
  name: string;
}

interface TechItemData {
  id: number;
  name: string;
  description: string;
  url: string | null;
  category: Category | null;
  introducedAt: string;
  sourceVideos: SourceVideo[];
  createdAt: string;
}

interface TechCardProps {
  item: TechItemData;
}

const CATEGORY_COLORS: Record<string, string> = {
  '언어 모델': 'border-l-blue-500',
  '코딩 도구': 'border-l-emerald-500',
  '영상 생성': 'border-l-red-500',
  '이미지 생성': 'border-l-pink-500',
  '음악 생성': 'border-l-violet-500',
  '검색 AI': 'border-l-amber-500',
  '챗봇/에이전트': 'border-l-cyan-500',
  'AI 에이전트': 'border-l-teal-500',
  '음성 AI': 'border-l-orange-500',
  '로봇/하드웨어': 'border-l-slate-500',
  '3D 생성': 'border-l-indigo-500',
  'AI 칩': 'border-l-gray-500',
  'AI 아바타': 'border-l-rose-500',
  '뇌-컴퓨터 인터페이스': 'border-l-purple-500',
};

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  '언어 모델': 'bg-blue-50 text-blue-700',
  '코딩 도구': 'bg-emerald-50 text-emerald-700',
  '영상 생성': 'bg-red-50 text-red-700',
  '이미지 생성': 'bg-pink-50 text-pink-700',
  '음악 생성': 'bg-violet-50 text-violet-700',
  '검색 AI': 'bg-amber-50 text-amber-700',
  '챗봇/에이전트': 'bg-cyan-50 text-cyan-700',
  'AI 에이전트': 'bg-teal-50 text-teal-700',
  '음성 AI': 'bg-orange-50 text-orange-700',
  '로봇/하드웨어': 'bg-slate-100 text-slate-700',
  '3D 생성': 'bg-indigo-50 text-indigo-700',
  'AI 칩': 'bg-gray-100 text-gray-700',
  'AI 아바타': 'bg-rose-50 text-rose-700',
  '뇌-컴퓨터 인터페이스': 'bg-purple-50 text-purple-700',
};

export default function TechCard({ item }: TechCardProps) {
  const categoryName = item.category?.name ?? '';
  const borderColor = CATEGORY_COLORS[categoryName] ?? 'border-l-gray-300';
  const badgeColor = CATEGORY_BADGE_COLORS[categoryName] ?? 'bg-gray-100 text-gray-700';

  return (
    <div className={`rounded-lg border border-gray-200 border-l-4 ${borderColor} bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900">
          {item.url ? (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-blue-600 hover:underline">
              {item.name}
              <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          ) : (
            item.name
          )}
        </h3>
        {item.category && (
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColor}`}>
            {item.category.name}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-600 line-clamp-2">{item.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-400">
        {item.sourceVideos.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.sourceVideos.map((video) => (
              <a
                key={video.id}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-0.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                  <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="white" />
                </svg>
                출처
              </a>
            ))}
          </div>
        )}
      </div>
      <PracticeTracker techItemId={item.id} />
    </div>
  );
}
