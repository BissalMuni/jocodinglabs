import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { techItems, sourceVideos, techItemVideos } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdmin } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  const authError = verifyAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, description, url, categoryId, introducedAt, sourceVideoUrls } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.length < 1 || name.length > 200) {
      return NextResponse.json(
        { error: 'name is required and must be 1-200 characters', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string' || description.length < 1 || description.length > 2000) {
      return NextResponse.json(
        { error: 'description is required and must be 1-2000 characters', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'categoryId is required', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    if (!introducedAt) {
      return NextResponse.json(
        { error: 'introducedAt is required', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

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

    // Handle source video URLs if provided
    if (sourceVideoUrls && Array.isArray(sourceVideoUrls) && sourceVideoUrls.length > 0) {
      for (const url of sourceVideoUrls) {
        // Find existing source video by URL or insert a new one
        const existing = await db
          .select()
          .from(sourceVideos)
          .where(eq(sourceVideos.url, url))
          .limit(1);

        let videoId: number;

        if (existing.length > 0) {
          videoId = existing[0].id;
        } else {
          const [newVideo] = await db
            .insert(sourceVideos)
            .values({
              url,
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
    }

    return NextResponse.json(createdItem, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create tech item', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
