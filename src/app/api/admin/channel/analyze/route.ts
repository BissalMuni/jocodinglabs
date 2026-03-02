import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sourceVideos, techItems, techItemVideos, categories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdmin } from '@/lib/admin-auth';
import { extractTranscript } from '@/lib/transcript';
import { analyzeTranscript } from '@/lib/analyzer';

interface VideoAnalysisResult {
  videoUrl: string;
  videoTitle: string;
  techCount: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  const authError = verifyAdmin(request);
  if (authError) return authError;

  try {
    // Find unanalyzed source videos
    const unanalyzed = await db
      .select()
      .from(sourceVideos)
      .where(eq(sourceVideos.analyzed, 0));

    if (unanalyzed.length === 0) {
      return NextResponse.json({
        results: [],
        message: '분석할 미처리 영상이 없습니다',
      });
    }

    // Load all categories for matching
    const allCategories = await db.select().from(categories);
    const categoryMap = new Map(allCategories.map((c) => [c.name, c.id]));

    const results: VideoAnalysisResult[] = [];

    for (const video of unanalyzed) {
      try {
        // Extract transcript
        const transcript = await extractTranscript(video.url);

        // Analyze with Claude, passing existing category names
        const existingCategoryNames = Array.from(categoryMap.keys());
        const analysis = await analyzeTranscript(transcript, video.url, existingCategoryNames);

        // Update video title if we got a better one
        if (analysis.videoTitle) {
          await db
            .update(sourceVideos)
            .set({ title: analysis.videoTitle })
            .where(eq(sourceVideos.id, video.id));
        }

        // Save each tech item
        let techCount = 0;
        for (const item of analysis.items) {
          // Find matching category or create new one
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

          // Insert tech item
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

          // Link tech item to source video
          await db.insert(techItemVideos).values({
            tech_item_id: newItem.id,
            source_video_id: video.id,
          });

          techCount++;
        }

        // Mark video as analyzed
        await db
          .update(sourceVideos)
          .set({ analyzed: 1 })
          .where(eq(sourceVideos.id, video.id));

        results.push({
          videoUrl: video.url,
          videoTitle: analysis.videoTitle || video.title,
          techCount,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          videoUrl: video.url,
          videoTitle: video.title,
          techCount: 0,
          error: message,
        });
      }
    }

    const totalTech = results.reduce((sum, r) => sum + r.techCount, 0);
    const successCount = results.filter((r) => !r.error).length;

    return NextResponse.json({
      results,
      summary: {
        totalVideos: unanalyzed.length,
        successCount,
        failCount: unanalyzed.length - successCount,
        totalTechItems: totalTech,
      },
      message: `${successCount}/${unanalyzed.length}개 영상 분석 완료, ${totalTech}개 기술 항목 추출`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `일괄 분석 실패: ${message}`, code: 'ANALYZE_ERROR' },
      { status: 500 },
    );
  }
}
