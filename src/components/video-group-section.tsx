'use client';

import TechCard from './tech-card';

interface SourceVideo {
  id: number;
  url: string;
  title: string;
}

interface Category {
  id: number;
  name: string;
}

interface TechItem {
  id: number;
  name: string;
  description: string;
  url: string | null;
  category: Category | null;
  introducedAt: string;
  sourceVideos: SourceVideo[];
  createdAt: string;
}

interface VideoGroupSectionProps {
  video: {
    id: number;
    title: string;
    url: string;
    publishedAt: string;
  };
  items: TechItem[];
}

export default function VideoGroupSection({ video, items }: VideoGroupSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3 border-b border-gray-200 pb-2">
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-base font-semibold text-gray-900 hover:text-red-600 hover:underline"
        >
          <svg className="h-5 w-5 shrink-0 text-red-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
            <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="white" />
          </svg>
          {video.title}
        </a>
        {video.publishedAt && (
          <span className="shrink-0 text-sm text-gray-500">{video.publishedAt}</span>
        )}
        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
          {items.length}개 기술
        </span>
      </div>
      <div className="space-y-3 pl-2">
        {items.map((item) => (
          <TechCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
