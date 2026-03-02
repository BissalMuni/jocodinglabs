import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { techItems, sourceVideos, techItemVideos, extractionJobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdmin } from '@/lib/admin-auth';

interface ConfirmItem {
  name: string;
  description: string;
  url: string;
  categoryId: number;
  introducedAt: string;
  sourceVideoUrl: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const authError = verifyAdmin(request);
  if (authError) return authError;

  try {
    const { jobId } = await params;
    const id = parseInt(jobId, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid job ID', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // Verify the job exists
    const [job] = await db
      .select()
      .from(extractionJobs)
      .where(eq(extractionJobs.id, id))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: 'Extraction job not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least 1 item is required', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const createdItems = [];

    for (const item of items as ConfirmItem[]) {
      const { name, description, url, categoryId, introducedAt, sourceVideoUrl } = item;

      // Create the tech item
      const [createdItem] = await db
        .insert(techItems)
        .values({
          name,
          description,
          url: url || null,
          category_id: categoryId,
          introduced_at: introducedAt,
        })
        .returning();

      // Find existing source video or create a new one
      if (sourceVideoUrl) {
        const existing = await db
          .select()
          .from(sourceVideos)
          .where(eq(sourceVideos.url, sourceVideoUrl))
          .limit(1);

        let videoId: number;

        if (existing.length > 0) {
          videoId = existing[0].id;
        } else {
          const [newVideo] = await db
            .insert(sourceVideos)
            .values({
              url: sourceVideoUrl,
              title: '',
              published_at: '',
            })
            .returning();
          videoId = newVideo.id;
        }

        // Create the junction record
        await db.insert(techItemVideos).values({
          tech_item_id: createdItem.id,
          source_video_id: videoId,
        });
      }

      createdItems.push(createdItem);
    }

    return NextResponse.json({ items: createdItems }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to confirm extraction items', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
