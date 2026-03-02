import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { techItems, techItemVideos } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdmin } from '@/lib/admin-auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyAdmin(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Invalid id parameter', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.categoryId !== undefined) updates.category_id = body.categoryId;
    if (body.introducedAt !== undefined) updates.introduced_at = body.introducedAt;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const [updatedItem] = await db
      .update(techItems)
      .set(updates)
      .where(eq(techItems.id, itemId))
      .returning();

    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Tech item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedItem);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update tech item', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyAdmin(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Invalid id parameter', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // Delete junction records first
    await db
      .delete(techItemVideos)
      .where(eq(techItemVideos.tech_item_id, itemId));

    // Delete the tech item
    const deleted = await db
      .delete(techItems)
      .where(eq(techItems.id, itemId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Tech item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete tech item', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
