import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sourceVideos, techItems, techItemVideos, categories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { scrapeAINewsVideos, fetchVideoUploadDate } from '@/lib/channel-scraper';
import { extractTranscript } from '@/lib/transcript';
import { analyzeTranscript } from '@/lib/analyzer';
import { fetchVideoDescription, parseTimestamps, formatTimestampsForAnalysis } from '@/lib/video-description';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Step 1: Sync — scrape new videos from 조코딩 channel
    const channelVideos = await scrapeAINewsVideos();

    const existingVideos = await db.select({ url: sourceVideos.url }).from(sourceVideos);
    const existingUrls = new Set(existingVideos.map((v) => v.url));

    const newVideos: Array<{ title: string; url: string }> = [];

    for (const video of channelVideos) {
      const url = `https://www.youtube.com/watch?v=${video.videoId}`;
      if (!existingUrls.has(url)) {
        const uploadDate = await fetchVideoUploadDate(video.videoId);
        await db.insert(sourceVideos).values({
          url,
          title: video.title,
          published_at: uploadDate || '',
          analyzed: 0,
        });
        newVideos.push({ title: video.title, url });
      }
    }

    const syncResult = {
      newCount: newVideos.length,
      existingCount: channelVideos.length - newVideos.length,
      totalFound: channelVideos.length,
    };

    // Step 2: Analyze — process unanalyzed videos
    const unanalyzed = await db
      .select()
      .from(sourceVideos)
      .where(eq(sourceVideos.analyzed, 0));

    const allCategories = await db.select().from(categories);
    const categoryMap = new Map(allCategories.map((c) => [c.name, c.id]));

    let totalTechItems = 0;
    let successCount = 0;
    let failCount = 0;

    for (const video of unanalyzed) {
      try {
        const transcript = await extractTranscript(video.url);

        // Fetch description and parse timestamps
        const description = await fetchVideoDescription(video.url);
        const timestamps = description ? parseTimestamps(description) : [];
        const tocText = formatTimestampsForAnalysis(timestamps);

        const existingCategoryNames = Array.from(categoryMap.keys());
        const analysis = await analyzeTranscript(transcript, video.url, existingCategoryNames, tocText || null);

        if (analysis.videoTitle) {
          await db
            .update(sourceVideos)
            .set({ title: analysis.videoTitle })
            .where(eq(sourceVideos.id, video.id));
        }

        for (const item of analysis.items) {
          let categoryId = categoryMap.get(item.suggestedCategory) ?? null;

          if (categoryId === null && item.suggestedCategory) {
            const maxOrder = Math.max(0, ...Array.from(categoryMap.values()));
            const [newCat] = await db
              .insert(categories)
              .values({
                name: item.suggestedCategory,
                sort_order: maxOrder + 1,
              })
              .returning();
            categoryId = newCat.id;
            categoryMap.set(item.suggestedCategory, newCat.id);
          }

          const [newItem] = await db
            .insert(techItems)
            .values({
              name: item.name,
              description: item.description,
              url: item.url || null,
              category_id: categoryId,
              introduced_at: video.published_at || new Date().toISOString().split('T')[0],
            })
            .returning();

          await db.insert(techItemVideos).values({
            tech_item_id: newItem.id,
            source_video_id: video.id,
          });

          totalTechItems++;
        }

        await db
          .update(sourceVideos)
          .set({ analyzed: 1 })
          .where(eq(sourceVideos.id, video.id));

        successCount++;
      } catch {
        failCount++;
      }
    }

    const analyzeResult = {
      totalVideos: unanalyzed.length,
      successCount,
      failCount,
      totalTechItems,
    };

    return NextResponse.json({
      syncResult,
      analyzeResult,
      message: `Sync: ${syncResult.newCount} new videos. Analyze: ${successCount}/${unanalyzed.length} videos, ${totalTechItems} tech items.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Cron sync-analyze failed: ${message}` },
      { status: 500 },
    );
  }
}
