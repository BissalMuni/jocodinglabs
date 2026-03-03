import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { db } from '@/db/client';
import { techItems } from '@/db/schema';
import { isNull, or, eq } from 'drizzle-orm';
import { enrichUrlsBatch } from '@/lib/url-enricher';

export async function POST(request: NextRequest) {
  const authError = verifyAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const dryRun = body.dryRun !== false;
    const limit = typeof body.limit === 'number' ? body.limit : 20;

    // Find tech items without URLs
    const itemsWithoutUrl = await db
      .select({
        id: techItems.id,
        name: techItems.name,
        description: techItems.description,
      })
      .from(techItems)
      .where(or(isNull(techItems.url), eq(techItems.url, '')))
      .limit(limit);

    if (itemsWithoutUrl.length === 0) {
      return NextResponse.json({
        enriched: [],
        skipped: 0,
        errors: 0,
        message: 'URL이 없는 항목이 없습니다.',
      });
    }

    // Call Claude to find URLs
    const results = await enrichUrlsBatch(itemsWithoutUrl);

    const enriched = results.filter((r) => r.url !== null);
    const skipped = results.filter((r) => r.url === null).length;

    // Apply to DB if not dry run
    if (!dryRun) {
      let errors = 0;
      for (const result of enriched) {
        if (result.confidence === 'low') continue;
        try {
          await db
            .update(techItems)
            .set({ url: result.url!, updated_at: new Date().toISOString() })
            .where(eq(techItems.id, result.techItemId));
        } catch {
          errors++;
        }
      }

      return NextResponse.json({
        enriched: enriched.map((r) => ({
          id: r.techItemId,
          name: r.name,
          url: r.url,
          confidence: r.confidence,
        })),
        applied: enriched.filter((r) => r.confidence !== 'low').length,
        skipped,
        errors,
        message: `${enriched.filter((r) => r.confidence !== 'low').length}개 URL이 적용되었습니다.`,
      });
    }

    return NextResponse.json({
      enriched: enriched.map((r) => ({
        id: r.techItemId,
        name: r.name,
        url: r.url,
        confidence: r.confidence,
      })),
      skipped,
      errors: 0,
      message: `${enriched.length}개 URL 발견 (미리보기 모드)`,
    });
  } catch (error) {
    console.error('URL enrichment error:', error);
    return NextResponse.json(
      { error: 'URL 보강 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
