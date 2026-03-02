import { NextRequest, NextResponse } from 'next/server';

export function verifyAdmin(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Authorization header required', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);

  if (token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'Invalid password', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  return null; // null means authorized
}
