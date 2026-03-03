import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MicrolinkProvider, captureAndStore } from './screenshot-service';
import type { ScreenshotProvider } from './screenshot-service';

// Mock @vercel/blob
vi.mock('@vercel/blob', () => ({
  put: vi.fn().mockResolvedValue({
    url: 'https://blob.vercel-storage.com/screenshots/1-123.png',
    pathname: 'screenshots/1-123.png',
  }),
}));

// Mock global fetch for Microlink tests
const originalFetch = globalThis.fetch;

describe('MicrolinkProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('이미지 응답을 Buffer로 변환한다', async () => {
    const mockBuffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG header
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: () => Promise.resolve(mockBuffer.buffer),
    });

    const provider = new MicrolinkProvider();
    const result = await provider.capture('https://example.com');

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.length).toBe(4);

    globalThis.fetch = originalFetch;
  });

  it('JSON 응답에서 스크린샷 URL을 추출하여 다운로드한다', async () => {
    const mockBuffer = new Uint8Array([0x89, 0x50]);
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({
          status: 'success',
          data: { screenshot: { url: 'https://screenshot.url/img.png' } },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockBuffer.buffer),
      });

    const provider = new MicrolinkProvider();
    const result = await provider.capture('https://example.com');

    expect(Buffer.isBuffer(result)).toBe(true);

    globalThis.fetch = originalFetch;
  });

  it('API 에러 시 예외를 던진다', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 429,
    });

    const provider = new MicrolinkProvider();
    await expect(provider.capture('https://example.com')).rejects.toThrow('Microlink API error: 429');

    globalThis.fetch = originalFetch;
  });
});

describe('captureAndStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('커스텀 provider로 캡처 후 Blob에 저장한다', async () => {
    const mockProvider: ScreenshotProvider = {
      capture: vi.fn().mockResolvedValue(Buffer.from([0x89, 0x50, 0x4e, 0x47])),
    };

    const result = await captureAndStore('https://example.com', 42, mockProvider);

    expect(mockProvider.capture).toHaveBeenCalledWith('https://example.com');
    expect(result.blobUrl).toContain('blob.vercel-storage.com');
    expect(result.blobPathname).toContain('screenshots/');
  });
});
