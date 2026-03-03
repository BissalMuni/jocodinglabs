import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { db } from '@/db/client';
import { techItems, screenshots } from '@/db/schema';
import { isNotNull, and } from 'drizzle-orm';
import { captureAndStore } from '@/lib/screenshot-service';

export async function POST(request: NextRequest) {
  const authError = verifyAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const techItemIds = body.techItemIds as number[] | undefined;
    const limit = typeof body.limit === 'number' ? body.limit : 10;

    // Find tech items with URLs that don't have screenshots yet
    const existingScreenshots = await db
      .select({ tech_item_id: screenshots.tech_item_id })
      .from(screenshots);
    const screenshotedIds = existingScreenshots.map((s) => s.tech_item_id);

    let itemsToCapture;
    if (techItemIds && techItemIds.length > 0) {
      itemsToCapture = await db
        .select({ id: techItems.id, name: techItems.name, url: techItems.url })
        .from(techItems)
        .where(
          and(
            isNotNull(techItems.url),
            // Filter to requested IDs that don't have screenshots
          ),
        )
        .limit(limit);
      itemsToCapture = itemsToCapture.filter(
        (item) => techItemIds.includes(item.id) && item.url && !screenshotedIds.includes(item.id),
      );
    } else {
      const allItems = await db
        .select({ id: techItems.id, name: techItems.name, url: techItems.url })
        .from(techItems)
        .where(isNotNull(techItems.url));
      itemsToCapture = allItems
        .filter((item) => item.url && item.url !== '' && !screenshotedIds.includes(item.id))
        .slice(0, limit);
    }

    const captured: Array<{ techItemId: number; name: string; blobUrl: string }> = [];
    const failed: Array<{ techItemId: number; name: string; error: string }> = [];

    for (const item of itemsToCapture) {
      try {
        const { blobUrl, blobPathname } = await captureAndStore(item.url!, item.id);

        await db.insert(screenshots).values({
          tech_item_id: item.id,
          blob_url: blobUrl,
          blob_pathname: blobPathname,
          width: 1280,
          height: 800,
          captured_at: new Date().toISOString(),
          status: 'completed',
        });

        captured.push({ techItemId: item.id, name: item.name, blobUrl });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';

        // Record the failure in DB
        try {
          await db.insert(screenshots).values({
            tech_item_id: item.id,
            blob_url: '',
            blob_pathname: '',
            captured_at: new Date().toISOString(),
            status: 'failed',
            error_message: errorMsg,
          });
        } catch {
          // Ignore DB insert error for failed screenshots
        }

        failed.push({ techItemId: item.id, name: item.name, error: errorMsg });
      }
    }

    return NextResponse.json({
      captured,
      failed,
      message: `${captured.length}개 캡처 성공, ${failed.length}개 실패`,
    });
  } catch (error) {
    console.error('Screenshot capture error:', error);
    return NextResponse.json(
      { error: '스크린샷 캡처 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
