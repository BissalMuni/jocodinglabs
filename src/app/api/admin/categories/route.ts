import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { categories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdmin } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  const authError = verifyAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, sortOrder } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'name is required', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.name, name))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Category with this name already exists', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(categories)
      .values({
        name,
        sort_order: sortOrder ?? 0,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create category', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
