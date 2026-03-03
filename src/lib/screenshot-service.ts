import { put } from '@vercel/blob';

export interface ScreenshotProvider {
  capture(url: string): Promise<Buffer>;
}

/**
 * Microlink API provider for screenshots.
 * Free tier: 50 requests/day.
 */
export class MicrolinkProvider implements ScreenshotProvider {
  async capture(url: string): Promise<Buffer> {
    const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1280&viewport.height=800&waitForTimeout=3000`;

    const res = await fetch(apiUrl);
    if (!res.ok) {
      throw new Error(`Microlink API error: ${res.status}`);
    }

    const contentType = res.headers.get('content-type') ?? '';

    // If response is an image (when using embed=screenshot.url)
    if (contentType.startsWith('image/')) {
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    // Otherwise it's JSON with a screenshot URL
    const data = await res.json();
    if (data.status !== 'success' || !data.data?.screenshot?.url) {
      throw new Error(`Microlink screenshot failed: ${data.status}`);
    }

    const imgRes = await fetch(data.data.screenshot.url);
    if (!imgRes.ok) {
      throw new Error(`Screenshot image download failed: ${imgRes.status}`);
    }

    const arrayBuffer = await imgRes.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

/**
 * Capture a screenshot and store it in Vercel Blob.
 */
export async function captureAndStore(
  url: string,
  techItemId: number,
  provider?: ScreenshotProvider,
): Promise<{ blobUrl: string; blobPathname: string }> {
  const screenshotProvider = provider ?? new MicrolinkProvider();
  const buffer = await screenshotProvider.capture(url);

  const filename = `screenshots/${techItemId}-${Date.now()}.png`;
  const blob = await put(filename, buffer, {
    access: 'public',
    contentType: 'image/png',
  });

  return {
    blobUrl: blob.url,
    blobPathname: blob.pathname,
  };
}
