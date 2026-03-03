'use client';

interface ScreenshotThumbnailProps {
  screenshotUrl: string;
  targetUrl: string;
  name: string;
}

export default function ScreenshotThumbnail({ screenshotUrl, targetUrl, name }: ScreenshotThumbnailProps) {
  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 block overflow-hidden rounded-md border border-gray-200 transition-shadow hover:shadow-md"
    >
      <img
        src={screenshotUrl}
        alt={`${name} 미리보기`}
        loading="lazy"
        className="h-auto w-full object-cover"
        style={{ maxHeight: '160px' }}
      />
    </a>
  );
}
