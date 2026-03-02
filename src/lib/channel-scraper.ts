const JOCODING_SEARCH_URL = 'https://www.youtube.com/@jocoding/search?query=AI%EB%89%B4%EC%8A%A4';

export interface ChannelVideo {
  videoId: string;
  title: string;
  publishedAt?: string;
}

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
};

/**
 * Scrape 조코딩 YouTube channel search results for AI뉴스 videos.
 * Uses the channel's /search?query=AI뉴스 page to find all matching videos,
 * not just the ones visible on the main /videos page.
 */
export async function scrapeAINewsVideos(): Promise<ChannelVideo[]> {
  const res = await fetch(JOCODING_SEARCH_URL, { headers: FETCH_HEADERS });

  if (!res.ok) {
    throw new Error(`채널 페이지 요청 실패: ${res.status}`);
  }

  const html = await res.text();
  const videos: ChannelVideo[] = [];
  const seen = new Set<string>();

  // Extract from ytInitialData JSON embedded in the page
  const dataMatch = html.match(/var ytInitialData\s*=\s*({[\s\S]+?});\s*<\/script>/);
  if (dataMatch) {
    try {
      const data = JSON.parse(dataMatch[1]);
      extractVideosFromData(data, videos, seen);
    } catch {
      // Fall through to regex approach
    }
  }

  // Fallback: regex-based extraction
  if (videos.length === 0) {
    const pattern = /"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"[\s\S]*?"title":\{"runs":\[\{"text":"([^"]+)"\}/g;
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const videoId = match[1];
      const title = match[2];
      if (!seen.has(videoId) && isAINewsTitle(title)) {
        seen.add(videoId);
        videos.push({ videoId, title });
      }
    }
  }

  return videos;
}

function isAINewsTitle(title: string): boolean {
  return title.includes('AI뉴스') || title.includes('AI 뉴스');
}

function extractVideosFromData(
  obj: unknown,
  videos: ChannelVideo[],
  seen: Set<string>,
): void {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      extractVideosFromData(item, videos, seen);
    }
    return;
  }

  const record = obj as Record<string, unknown>;

  // Look for videoRenderer (search results use this pattern)
  const renderer =
    (record['videoRenderer'] as Record<string, unknown>) ??
    (record['gridVideoRenderer'] as Record<string, unknown>) ??
    (record['richItemRenderer'] as Record<string, unknown>);

  if (renderer) {
    const innerRenderer =
      renderer['videoId']
        ? renderer
        : ((renderer['content'] as Record<string, unknown>)?.['videoRenderer'] as Record<string, unknown>);

    if (innerRenderer && typeof innerRenderer['videoId'] === 'string') {
      const videoId = innerRenderer['videoId'] as string;
      const titleObj = innerRenderer['title'] as Record<string, unknown> | undefined;
      let title = '';

      if (titleObj) {
        if (typeof titleObj['simpleText'] === 'string') {
          title = titleObj['simpleText'] as string;
        } else if (Array.isArray(titleObj['runs'])) {
          title = (titleObj['runs'] as Array<{ text: string }>)
            .map((r) => r.text)
            .join('');
        }
      }

      if (title && !seen.has(videoId) && isAINewsTitle(title)) {
        seen.add(videoId);

        // Extract publishedTimeText (relative time like "1년 전", "3개월 전")
        const publishedObj = innerRenderer['publishedTimeText'] as Record<string, unknown> | undefined;
        let publishedAt: string | undefined;
        if (publishedObj && typeof publishedObj['simpleText'] === 'string') {
          publishedAt = publishedObj['simpleText'] as string;
        }

        videos.push({ videoId, title, publishedAt });
      }
    }
  }

  // Recurse into all values
  for (const value of Object.values(record)) {
    if (typeof value === 'object' && value !== null) {
      extractVideosFromData(value, videos, seen);
    }
  }
}
