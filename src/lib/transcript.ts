import { fetchTranscript, TranscriptResponse } from 'youtube-transcript-plus';

export async function extractTranscript(videoUrl: string): Promise<string> {
  // Try Korean first, then auto-generated Korean, then any available language
  const langAttempts = ['ko', 'ko-auto', undefined];

  for (const lang of langAttempts) {
    try {
      const segments: TranscriptResponse[] = await fetchTranscript(videoUrl, {
        lang,
      });
      if (segments.length > 0) {
        return segments.map((s) => s.text).join(' ');
      }
    } catch {
      // Try next language
    }
  }

  throw new Error(
    `자막을 찾을 수 없습니다: 사용 가능한 자막이 없습니다 (${videoUrl})`,
  );
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}
