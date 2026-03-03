import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before imports
vi.mock('@/db/client', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}));

vi.mock('@/lib/url-enricher', () => ({
  enrichUrlsBatch: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/admin-auth', () => ({
  verifyAdmin: vi.fn().mockReturnValue(null),
}));

import { POST } from './route';
import { verifyAdmin } from '@/lib/admin-auth';
import { enrichUrlsBatch } from '@/lib/url-enricher';
import { db } from '@/db/client';

function createRequest(body: Record<string, unknown>, token = 'test-token'): Request {
  return new Request('http://localhost/api/admin/enrich-urls', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/enrich-urls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAdmin).mockReturnValue(null);
  });

  it('인증 실패시 401 반환', async () => {
    const { NextResponse } = await import('next/server');
    vi.mocked(verifyAdmin).mockReturnValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const res = await POST(createRequest({}) as never);
    expect(res.status).toBe(401);
  });

  it('URL 없는 항목이 없으면 빈 결과 반환', async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as never);

    const res = await POST(createRequest({ dryRun: true }) as never);
    const data = await res.json();

    expect(data.enriched).toEqual([]);
    expect(data.message).toContain('없습니다');
  });

  it('dry run 모드에서 미리보기 결과 반환', async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            { id: 1, name: 'TestTech', description: '테스트' },
          ]),
        }),
      }),
    } as never);

    vi.mocked(enrichUrlsBatch).mockResolvedValue([
      { techItemId: 1, name: 'TestTech', url: 'https://test.com', confidence: 'high' },
    ]);

    const res = await POST(createRequest({ dryRun: true }) as never);
    const data = await res.json();

    expect(data.enriched).toHaveLength(1);
    expect(data.enriched[0].url).toBe('https://test.com');
    expect(data.message).toContain('미리보기');
  });
});
