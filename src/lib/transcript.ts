import { fetchTranscript, TranscriptResponse } from 'youtube-transcript-plus';

export async function extractTranscript(videoUrl: string): Promise<string> {
  try {
    const segments: TranscriptResponse[] = await fetchTranscript(videoUrl);
    return segments.map((s) => s.text).join(' ');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`자막을 찾을 수 없습니다: ${message}`);
  }
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
