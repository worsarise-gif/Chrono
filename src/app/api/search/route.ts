import { NextRequest, NextResponse } from 'next/server';
import { vectorSearch } from '@/lib/tools/vectorSearch';
import { legacyWebSearch } from '@/lib/tools/legacyWebSearch';
import { verifySession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body.query;
    const forceRefresh = body.forceRefresh;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Try vector search first
    let results = await vectorSearch(query);

    // Check if vector search results are empty or invalid
    let shouldFallback = false;
    if (!results || results === "Search unavailable. Rely on training data." || results === "[]") {
      shouldFallback = true;
    } else if (typeof results === 'string') {
      try {
        const parsed = JSON.parse(results);
        if (Array.isArray(parsed) && parsed.length === 0) {
          shouldFallback = true;
        }
      } catch (e) {
        // If it's a string but not JSON, it might be an error message or raw text
        // In our case vectorSearch returns stringified JSON, so if it fails, it's likely an error msg
        shouldFallback = true;
      }
    } else if (Array.isArray(results) && (results as any[]).length === 0) {
        shouldFallback = true;
    }

    // If vector search returns no results, fallback to legacy web search
    if (shouldFallback) {
      console.log('Vector search returned no results, falling back to legacy web search');
      results = await legacyWebSearch(query, forceRefresh);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('API search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
