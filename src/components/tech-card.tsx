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

export default function TechCard({ item }: TechCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {item.url ? (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline">
              {item.name}
            </a>
          ) : (
            item.name
          )}
        </h3>
        {item.category && (
          <span className="shrink-0 rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-700">
            {item.category.name}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span>{item.introducedAt}</span>
        {item.sourceVideos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.sourceVideos.map((video) => (
              <a
                key={video.id}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 hover:underline"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                  <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="white" />
                </svg>
                {video.title}
              </a>
            ))}
          </div>
        )}
      </div>
      <PracticeTracker techItemId={item.id} />
    </div>
  );
}
