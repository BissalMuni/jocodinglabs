import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { techItems, sourceVideos, techItemVideos } from '@/db/schema';
import { eq, like, desc, asc, or, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') ?? 'newest';
    const groupBy = searchParams.get('groupBy');

    // Build where conditions
    const conditions: ReturnType<typeof eq>[] = [];

    if (category) {
      conditions.push(eq(techItems.category_id, Number(category)));
    }

    if (search) {
      const pattern = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          like(sql`LOWER(${techItems.name})`, pattern),
          like(sql`LOWER(${techItems.description})`, pattern),
        )!,
      );
    }

    // Determine sort order
    const orderBy = sort === 'oldest'
      ? asc(techItems.introduced_at)
      : desc(techItems.introduced_at);

    // Query with relations using drizzle's relational query API
    const results = await db.query.techItems.findMany({
      where: conditions.length === 1
        ? conditions[0]
        : conditions.length > 1
          ? (items, { and }) => and(...conditions)
          : undefined,
      orderBy: [orderBy],
      with: {
        category: true,
        techItemVideos: {
          with: {
            sourceVideo: true,
          },
        },
      },
    });

    // Transform results to the expected shape with camelCase keys
    const items = results.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      url: item.url ?? null,
      category: item.category
        ? { id: item.category.id, name: item.category.name }
        : null,
      introducedAt: item.introduced_at,
      sourceVideos: item.techItemVideos.map((pivot) => ({
        id: pivot.sourceVideo.id,
        url: pivot.sourceVideo.url,
        title: pivot.sourceVideo.title,
        publishedAt: pivot.sourceVideo.published_at,
      })),
      createdAt: item.created_at,
    }));

    // Group by video if requested
    if (groupBy === 'video') {
      // Collect all source videos with their items
      const videoMap = new Map<number, {
        video: { id: number; title: string; url: string; publishedAt: string };
        items: typeof items;
      }>();

      // Also fetch all source videos to include those without tech items
      const allSourceVideos = await db.select().from(sourceVideos).where(eq(sourceVideos.analyzed, 1));

      // Initialize map with all analyzed videos
      for (const sv of allSourceVideos) {
        videoMap.set(sv.id, {
          video: {
            id: sv.id,
            title: sv.title,
            url: sv.url,
            publishedAt: sv.published_at,
          },
          items: [],
        });
      }

      // Assign items to their video groups
      for (const item of items) {
        for (const sv of item.sourceVideos) {
          const group = videoMap.get(sv.id);
          if (group) {
            group.items.push(item);
          } else {
            videoMap.set(sv.id, {
              video: {
                id: sv.id,
                title: sv.title,
                url: sv.url,
                publishedAt: sv.publishedAt || '',
              },
              items: [item],
            });
          }
        }
      }

      // Sort groups by video publishedAt (newest first), then by video id desc
      const groups = Array.from(videoMap.values())
        .filter((g) => g.items.length > 0)
        .sort((a, b) => {
          const dateA = a.video.publishedAt || '';
          const dateB = b.video.publishedAt || '';
          if (dateB !== dateA) return dateB.localeCompare(dateA);
          return b.video.id - a.video.id;
        });

      return NextResponse.json({ groups });
    }

    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    console.error('Error fetching tech items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tech items' },
      { status: 500 },
    );
  }
}
