import { NextRequest, NextResponse } from 'next/server';
import { vectorSearch } from '@/lib/tools/vectorSearch';
import { verifySession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { query, forceRefresh } = await req.json();
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const results = await vectorSearch(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('API search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
