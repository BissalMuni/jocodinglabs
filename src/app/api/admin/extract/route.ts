import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { extractionJobs, categories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdmin } from '@/lib/admin-auth';
import { extractTranscript } from '@/lib/transcript';
import { analyzeTranscript } from '@/lib/analyzer';
import { fetchVideoDescription, parseTimestamps, formatTimestampsForAnalysis } from '@/lib/video-description';
import type { ExtractionResult } from '@/types';

export async function POST(request: NextRequest) {
  const authError = verifyAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { videoUrls } = body;

    // Validate at least 1 URL provided
    if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
      return NextResponse.json(
        { error: 'At least 1 video URL is required', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // Create extraction job with pending status
    const [job] = await db
      .insert(extractionJobs)
      .values({
        status: 'pending',
        video_urls: JSON.stringify(videoUrls),
      })
      .returning();

    // Load existing categories for the analyzer
    const allCategories = await db.select().from(categories);
    const existingCategoryNames = allCategories.map((c) => c.name);

    // Process extraction for each video URL
    const results: ExtractionResult[] = [];
    let successCount = 0;

    for (const videoUrl of videoUrls) {
      try {
        const transcript = await extractTranscript(videoUrl);

        // Fetch description and parse timestamps for better analysis
        const description = await fetchVideoDescription(videoUrl);
        const timestamps = description ? parseTimestamps(description) : [];
        const tocText = formatTimestampsForAnalysis(timestamps);

        const analysis = await analyzeTranscript(transcript, videoUrl, existingCategoryNames, tocText || null);

        results.push({
          videoUrl,
          videoTitle: analysis.videoTitle,
          extractedItems: analysis.items.map((item) => ({
            name: item.name,
            description: item.description,
            url: item.url || '',
            suggestedCategory: item.suggestedCategory,
          })),
        });
        successCount++;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          videoUrl,
          videoTitle: '',
          extractedItems: [],
          error: message,
        });
      }
    }

    // Update job based on results
    if (successCount === 0) {
      // All videos failed
      await db
        .update(extractionJobs)
        .set({
          status: 'failed',
          error_message: 'All videos failed to process',
          result: JSON.stringify(results),
          completed_at: new Date().toISOString(),
        })
        .where(eq(extractionJobs.id, job.id));
    } else {
      // At least some succeeded
      await db
        .update(extractionJobs)
        .set({
          status: 'completed',
          result: JSON.stringify(results),
          completed_at: new Date().toISOString(),
        })
        .where(eq(extractionJobs.id, job.id));
    }

    return NextResponse.json(
      { jobId: job.id, status: 'pending', videoCount: videoUrls.length },
      { status: 202 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to create extraction job', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
