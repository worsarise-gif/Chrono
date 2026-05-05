import { NextRequest, NextResponse } from 'next/server';
import { webSearch } from '@/lib/tools/webSearch';
import { verifySession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const results = await webSearch(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('API search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
