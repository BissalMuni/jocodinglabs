const JOCODING_SEARCH_URL = 'https://www.youtube.com/@jocoding/search?query=AI%EB%89%B4%EC%8A%A4';
const YOUTUBE_BROWSE_URL = 'https://www.youtube.com/youtubei/v1/search';

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

const INNERTUBE_CLIENT = {
  clientName: 'WEB',
  clientVersion: '2.20240101.00.00',
  hl: 'ko',
  gl: 'KR',
};

// Max continuation pages to fetch (prevent infinite loops)
const MAX_CONTINUATION_PAGES = 5;

/**
 * Scrape 조코딩 YouTube channel search results for AI뉴스 videos.
 * Fetches the initial page + continuation pages to collect all matching videos.
 */
export async function scrapeAINewsVideos(): Promise<ChannelVideo[]> {
  const res = await fetch(JOCODING_SEARCH_URL, { headers: FETCH_HEADERS });

  if (!res.ok) {
    throw new Error(`채널 페이지 요청 실패: ${res.status}`);
  }

  const html = await res.text();
  const videos: ChannelVideo[] = [];
  const seen = new Set<string>();

  // Extract API key for continuation requests
  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY"\s*:\s*"([^"]+)"/);
  const apiKey = apiKeyMatch?.[1] ?? '';

  // Extract from ytInitialData JSON embedded in the page
  const dataMatch = html.match(/var ytInitialData\s*=\s*({[\s\S]+?});\s*<\/script>/);
  let continuationToken: string | null = null;

  if (dataMatch) {
    try {
      const data = JSON.parse(dataMatch[1]);
      extractVideosFromData(data, videos, seen);
      continuationToken = extractContinuationToken(data);
    } catch {
      // Fall through to regex approach
    }
  }

  // Fallback: regex-based extraction (initial page only)
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

  // Fetch continuation pages for more results
  if (apiKey && continuationToken) {
    for (let page = 0; page < MAX_CONTINUATION_PAGES; page++) {
      try {
        const contResult = await fetchContinuation(apiKey, continuationToken);
        if (!contResult) break;

        const prevCount = videos.length;
        extractVideosFromData(contResult.data, videos, seen);

        // No new videos found — stop
        if (videos.length === prevCount) break;

        continuationToken = contResult.nextToken;
        if (!continuationToken) break;
      } catch {
        break;
      }
    }
  }

  return videos;
}

/**
 * Fetch a continuation page from YouTube's internal API.
 */
async function fetchContinuation(
  apiKey: string,
  continuationToken: string,
): Promise<{ data: unknown; nextToken: string | null } | null> {
  const url = `${YOUTUBE_BROWSE_URL}?key=${apiKey}`;
  const body = {
    context: { client: INNERTUBE_CLIENT },
    continuation: continuationToken,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...FETCH_HEADERS,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const nextToken = extractContinuationToken(data);
  return { data, nextToken };
}

/**
 * Recursively search for continuation token in YouTube data.
 */
function extractContinuationToken(obj: unknown): string | null {
  if (!obj || typeof obj !== 'object') return null;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const token = extractContinuationToken(item);
      if (token) return token;
    }
    return null;
  }

  const record = obj as Record<string, unknown>;

  // Look for continuationEndpoint or continuationCommand
  const contRenderer = record['continuationItemRenderer'] as Record<string, unknown> | undefined;
  if (contRenderer) {
    const endpoint = contRenderer['continuationEndpoint'] as Record<string, unknown> | undefined;
    const command = endpoint?.['continuationCommand'] as Record<string, unknown> | undefined;
    if (command && typeof command['token'] === 'string') {
      return command['token'] as string;
    }
  }

  // Also check for nextContinuationData pattern
  const nextCont = record['nextContinuationData'] as Record<string, unknown> | undefined;
  if (nextCont && typeof nextCont['continuation'] === 'string') {
    return nextCont['continuation'] as string;
  }

  // Recurse into values
  for (const value of Object.values(record)) {
    if (typeof value === 'object' && value !== null) {
      const token = extractContinuationToken(value);
      if (token) return token;
    }
  }

  return null;
}

/**
 * Fetch the actual upload date of a YouTube video by scraping its page.
 * Returns ISO date string (e.g. "2025-01-15") or null if not found.
 */
export async function fetchVideoUploadDate(videoId: string): Promise<string | null> {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) return null;

    const html = await res.text();

    // Try JSON-LD: "uploadDate":"2025-01-15" or "datePublished":"2025-01-15"
    const uploadMatch = html.match(/"(?:uploadDate|datePublished)"\s*:\s*"(\d{4}-\d{2}-\d{2})"/);
    if (uploadMatch) return uploadMatch[1];

    // Try meta tag: <meta itemprop="datePublished" content="2025-01-15">
    const metaMatch = html.match(/<meta\s+itemprop="datePublished"\s+content="(\d{4}-\d{2}-\d{2})"/);
    if (metaMatch) return metaMatch[1];

    // Try publishDate in ytInitialPlayerResponse
    const publishMatch = html.match(/"publishDate"\s*:\s*"(\d{4}-\d{2}-\d{2})"/);
    if (publishMatch) return publishMatch[1];

    return null;
  } catch {
    return null;
  }
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

  // Recurse into all values (skip continuationItemRenderer to avoid noise)
  for (const [key, value] of Object.entries(record)) {
    if (key === 'continuationItemRenderer') continue;
    if (typeof value === 'object' && value !== null) {
      extractVideosFromData(value, videos, seen);
    }
  }
}
