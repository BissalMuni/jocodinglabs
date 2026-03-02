import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { categories } from '@/db/schema';
import { asc } from 'drizzle-orm';

export async function GET(_request: NextRequest) {
  try {
    const results = await db
      .select({
        id: categories.id,
        name: categories.name,
        sortOrder: categories.sort_order,
      })
      .from(categories)
      .orderBy(asc(categories.sort_order));

    return NextResponse.json({ categories: results });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 },
    );
  }
}
