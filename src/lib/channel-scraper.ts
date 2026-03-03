const JOCODING_VIDEOS_URL = 'https://www.youtube.com/@jocoding/videos';
const YOUTUBE_BROWSE_URL = 'https://www.youtube.com/youtubei/v1/browse';

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

// Max continuation pages to fetch (videos tab has more content)
const MAX_CONTINUATION_PAGES = 20;

// Only fetch videos from the last N months
const DATE_CUTOFF_MONTHS = 6;

/**
 * Parse Korean/English relative date text and check if within cutoff months.
 * Returns true if the date is within the cutoff or if parsing fails (conservative).
 */
export function isWithinDateCutoff(publishedTimeText: string, monthsCutoff: number): boolean {
  if (!publishedTimeText) return true;

  // Strip common prefixes like "Streamed " or "최초 공개: "
  const cleaned = publishedTimeText.replace(/^(Streamed\s+|최초\s*공개:\s*)/i, '');

  // Korean patterns: "3개월 전", "1년 전", "2주 전", "3일 전", "5시간 전"
  const koMatch = cleaned.match(/(\d+)\s*(년|개월|주|일|시간|분|초)\s*전/);
  if (koMatch) {
    const num = parseInt(koMatch[1], 10);
    const unit = koMatch[2];
    const months = toMonths(num, unit);
    return months <= monthsCutoff;
  }

  // English patterns: "3 months ago", "1 year ago", "2 weeks ago"
  const enMatch = cleaned.match(/(\d+)\s*(year|month|week|day|hour|minute|second)s?\s*ago/i);
  if (enMatch) {
    const num = parseInt(enMatch[1], 10);
    const unit = enMatch[2].toLowerCase();
    const unitMap: Record<string, string> = {
      year: '년', month: '개월', week: '주', day: '일',
      hour: '시간', minute: '분', second: '초',
    };
    const months = toMonths(num, unitMap[unit] ?? '개월');
    return months <= monthsCutoff;
  }

  // Can't parse — include conservatively
  return true;
}

function toMonths(num: number, unit: string): number {
  switch (unit) {
    case '년': return num * 12;
    case '개월': return num;
    case '주': return num / 4;
    case '일': return num / 30;
    case '시간': return num / (30 * 24);
    case '분': return num / (30 * 24 * 60);
    case '초': return num / (30 * 24 * 60 * 60);
    default: return 0;
  }
}

/**
 * Scrape 조코딩 YouTube channel videos tab for AI뉴스 videos.
 * Uses the videos tab instead of search for broader coverage,
 * with a date cutoff to limit to recent content.
 */
export async function scrapeAINewsVideos(): Promise<ChannelVideo[]> {
  const res = await fetch(JOCODING_VIDEOS_URL, { headers: FETCH_HEADERS });

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
    let reachedCutoff = false;
    for (let page = 0; page < MAX_CONTINUATION_PAGES; page++) {
      if (reachedCutoff) break;
      try {
        const contResult = await fetchContinuation(apiKey, continuationToken);
        if (!contResult) break;

        const prevCount = videos.length;
        reachedCutoff = extractVideosFromData(contResult.data, videos, seen);

        // No new videos found — stop
        if (videos.length === prevCount && !reachedCutoff) break;

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

export function isAINewsTitle(title: string): boolean {
  return title.includes('AI뉴스') || title.includes('AI 뉴스');
}

/**
 * Recursively extract video data from YouTube's data structure.
 * Returns true if a video beyond the date cutoff was encountered (signals to stop pagination).
 */
export function extractVideosFromData(
  obj: unknown,
  videos: ChannelVideo[],
  seen: Set<string>,
): boolean {
  if (!obj || typeof obj !== 'object') return false;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const pastCutoff = extractVideosFromData(item, videos, seen);
      if (pastCutoff) return true;
    }
    return false;
  }

  const record = obj as Record<string, unknown>;

  // Look for videoRenderer (videos tab uses richItemRenderer > videoRenderer)
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

      // Extract publishedTimeText (relative time like "1년 전", "3개월 전")
      const publishedObj = innerRenderer['publishedTimeText'] as Record<string, unknown> | undefined;
      let publishedAt: string | undefined;
      if (publishedObj && typeof publishedObj['simpleText'] === 'string') {
        publishedAt = publishedObj['simpleText'] as string;
      }

      // Check date cutoff — if past cutoff, signal to stop pagination
      if (publishedAt && !isWithinDateCutoff(publishedAt, DATE_CUTOFF_MONTHS)) {
        return true;
      }

      if (title && !seen.has(videoId) && isAINewsTitle(title)) {
        seen.add(videoId);
        videos.push({ videoId, title, publishedAt });
      }
    }
  }

  // Recurse into all values (skip continuationItemRenderer to avoid noise)
  for (const [key, value] of Object.entries(record)) {
    if (key === 'continuationItemRenderer') continue;
    if (typeof value === 'object' && value !== null) {
      const pastCutoff = extractVideosFromData(value, videos, seen);
      if (pastCutoff) return true;
    }
  }

  return false;
}
