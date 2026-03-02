import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { extractionJobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET(
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

    return NextResponse.json({
      id: job.id,
      status: job.status,
      videoUrls: JSON.parse(job.video_urls),
      result: job.result ? JSON.parse(job.result) : null,
      errorMessage: job.error_message,
      createdAt: job.created_at,
      completedAt: job.completed_at,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch extraction job', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
