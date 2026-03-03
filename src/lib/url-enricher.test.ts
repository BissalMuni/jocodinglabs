import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    },
  };
});

import { findOfficialUrl, enrichUrlsBatch } from './url-enricher';

describe('findOfficialUrl', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('유효한 URL과 confidence를 반환한다', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: '{"url": "https://openai.com", "confidence": "high"}' }],
    });

    const result = await findOfficialUrl('ChatGPT', 'OpenAI의 대화형 AI');
    expect(result.url).toBe('https://openai.com');
    expect(result.confidence).toBe('high');
  });

  it('URL을 모를 때 null을 반환한다', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: '{"url": null, "confidence": "low"}' }],
    });

    const result = await findOfficialUrl('Unknown Tech', '알 수 없는 기술');
    expect(result.url).toBeNull();
    expect(result.confidence).toBe('low');
  });

  it('파싱 실패시 안전하게 fallback', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'invalid json' }],
    });

    const result = await findOfficialUrl('Test', 'test');
    expect(result.url).toBeNull();
    expect(result.confidence).toBe('low');
  });
});

describe('enrichUrlsBatch', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('여러 항목을 순차적으로 처리한다', async () => {
    mockCreate
      .mockResolvedValueOnce({
        content: [{ type: 'text', text: '{"url": "https://a.com", "confidence": "high"}' }],
      })
      .mockResolvedValueOnce({
        content: [{ type: 'text', text: '{"url": null, "confidence": "low"}' }],
      });

    const results = await enrichUrlsBatch([
      { id: 1, name: 'A', description: 'desc A' },
      { id: 2, name: 'B', description: 'desc B' },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].url).toBe('https://a.com');
    expect(results[0].confidence).toBe('high');
    expect(results[1].url).toBeNull();
  });

  it('API 에러시 해당 항목만 low confidence로 처리', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API Error'));

    const results = await enrichUrlsBatch([
      { id: 1, name: 'Fail', description: 'fail' },
    ]);

    expect(results).toHaveLength(1);
    expect(results[0].url).toBeNull();
    expect(results[0].confidence).toBe('low');
  });
});
