const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
};

export interface TimestampEntry {
  time: string;
  label: string;
}

/**
 * Fetch the video description (더보기) from a YouTube video page.
 */
export async function fetchVideoDescription(videoUrl: string): Promise<string | null> {
  try {
    const res = await fetch(videoUrl, { headers: FETCH_HEADERS });
    if (!res.ok) return null;

    const html = await res.text();

    // Try ytInitialData → engagementPanels or description
    const dataMatch = html.match(/var ytInitialData\s*=\s*({[\s\S]+?});\s*<\/script>/);
    if (dataMatch) {
      try {
        const data = JSON.parse(dataMatch[1]);
        const desc = extractDescriptionFromData(data);
        if (desc) return desc;
      } catch {
        // Fall through
      }
    }

    // Try ytInitialPlayerResponse
    const playerMatch = html.match(/var ytInitialPlayerResponse\s*=\s*({[\s\S]+?});\s*<\/script>/);
    if (playerMatch) {
      try {
        const player = JSON.parse(playerMatch[1]);
        const desc = player?.videoDetails?.shortDescription;
        if (typeof desc === 'string' && desc.length > 0) return desc;
      } catch {
        // Fall through
      }
    }

    // Regex fallback: "shortDescription":"..."
    const descMatch = html.match(/"shortDescription"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (descMatch) {
      return JSON.parse(`"${descMatch[1]}"`);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Recursively find description text in ytInitialData.
 */
function extractDescriptionFromData(obj: unknown): string | null {
  if (!obj || typeof obj !== 'object') return null;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const result = extractDescriptionFromData(item);
      if (result) return result;
    }
    return null;
  }

  const record = obj as Record<string, unknown>;

  // Look for attributedDescription (newer format)
  const attrDesc = record['attributedDescription'] as Record<string, unknown> | undefined;
  if (attrDesc && typeof attrDesc['content'] === 'string') {
    return attrDesc['content'] as string;
  }

  // Look for description with runs
  if (record['description'] && typeof record['description'] === 'object') {
    const descObj = record['description'] as Record<string, unknown>;
    if (Array.isArray(descObj['runs'])) {
      const text = (descObj['runs'] as Array<{ text?: string }>)
        .map((r) => r.text ?? '')
        .join('');
      if (text.length > 50) return text;
    }
    if (typeof descObj['simpleText'] === 'string') {
      const text = descObj['simpleText'] as string;
      if (text.length > 50) return text;
    }
  }

  // Recurse — but limit depth to avoid huge traversals
  for (const [key, value] of Object.entries(record)) {
    if (key === 'continuationItemRenderer') continue;
    if (typeof value === 'object' && value !== null) {
      const result = extractDescriptionFromData(value);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Parse timestamp entries from a video description.
 * Matches patterns like:
 *   00:00 인트로
 *   01:23 GPT-5 출시
 *   1:05:30 마무리
 */
export function parseTimestamps(description: string): TimestampEntry[] {
  const entries: TimestampEntry[] = [];
  const lines = description.split('\n');

  for (const line of lines) {
    const match = line.match(/(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)/);
    if (match) {
      entries.push({
        time: match[1],
        label: match[2].trim(),
      });
    }
  }

  return entries;
}

/**
 * Format timestamps into a readable table of contents string.
 */
export function formatTimestampsForAnalysis(timestamps: TimestampEntry[]): string {
  if (timestamps.length === 0) return '';

  return '영상 목차 (더보기란 타임스탬프):\n' +
    timestamps.map((t) => `[${t.time}] ${t.label}`).join('\n');
}
