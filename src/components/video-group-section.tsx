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
    <section>
      <div className="mb-4 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-start gap-3 text-white"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-600 transition-transform group-hover:scale-110">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </span>
            <div>
              <span className="text-base font-semibold leading-snug group-hover:underline">
                {video.title}
              </span>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                {video.publishedAt && <span>{video.publishedAt}</span>}
                <span className="rounded-full bg-white/10 px-2 py-0.5">
                  {items.length}개 기술 소개
                </span>
              </div>
            </div>
          </a>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <TechCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
