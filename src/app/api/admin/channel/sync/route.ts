import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sourceVideos } from '@/db/schema';
import { verifyAdmin } from '@/lib/admin-auth';
import { scrapeAINewsVideos, fetchVideoUploadDate } from '@/lib/channel-scraper';

export async function POST(request: NextRequest) {
  const authError = verifyAdmin(request);
  if (authError) return authError;

  try {
    const channelVideos = await scrapeAINewsVideos();

    if (channelVideos.length === 0) {
      return NextResponse.json({
        newVideos: [],
        existingCount: 0,
        message: '채널에서 AI뉴스 영상을 찾을 수 없습니다',
      });
    }

    // Check which videos already exist in DB
    const existingVideos = await db.select({ url: sourceVideos.url }).from(sourceVideos);
    const existingUrls = new Set(existingVideos.map((v) => v.url));

    const newVideos: Array<{ videoId: string; title: string; url: string; publishedAt: string }> = [];

    for (const video of channelVideos) {
      const url = `https://www.youtube.com/watch?v=${video.videoId}`;
      if (!existingUrls.has(url)) {
        // Fetch actual upload date from YouTube video page
        const uploadDate = await fetchVideoUploadDate(video.videoId);
        newVideos.push({
          ...video,
          url,
          publishedAt: uploadDate || '',
        });
      }
    }

    // Insert new videos
    for (const video of newVideos) {
      await db.insert(sourceVideos).values({
        url: video.url,
        title: video.title,
        published_at: video.publishedAt,
        analyzed: 0,
      });
    }

    return NextResponse.json({
      newVideos: newVideos.map((v) => ({ title: v.title, url: v.url, publishedAt: v.publishedAt })),
      newCount: newVideos.length,
      existingCount: channelVideos.length - newVideos.length,
      totalFound: channelVideos.length,
      message: newVideos.length > 0
        ? `${newVideos.length}개의 새로운 AI뉴스 영상을 추가했습니다`
        : '새로운 AI뉴스 영상이 없습니다',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `채널 동기화 실패: ${message}`, code: 'SYNC_ERROR' },
      { status: 500 },
    );
  }
}
