const fs = require('fs');

const code = `import { NextRequest, NextResponse } from 'next/server';
import { vectorSearch } from '@/lib/tools/vectorSearch';
import { legacyWebSearch } from '@/lib/tools/legacyWebSearch';
import { verifySession } from '@/lib/auth';
import { withRetry } from '@/lib/withRetry';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body.query;
    const forceRefresh = body.forceRefresh;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    try {
      const results = await withRetry(async () => {
        let res = await vectorSearch(query);

        let shouldFallback = false;
        if (!res || res === "Search unavailable. Rely on training data." || res === "[]") {
          shouldFallback = true;
        } else if (typeof res === 'string') {
          try {
            const parsed = JSON.parse(res);
            if (Array.isArray(parsed) && parsed.length === 0) {
              shouldFallback = true;
            }
          } catch (e) {
            shouldFallback = true;
          }
        } else if (Array.isArray(res) && (res as any[]).length === 0) {
            shouldFallback = true;
        }

        if (shouldFallback) {
          console.log('Vector search returned no results, falling back to legacy web search');
          res = await legacyWebSearch(query, forceRefresh);
        }

        return res;
      });

      return NextResponse.json({ results });
    } catch (err) {
      console.warn('Search completely failed:', err);
      // Silent fallback — return empty result rather than an error
      return NextResponse.json({ results: [] });
    }
  } catch (error) {
    console.error('API search error:', error);
    return NextResponse.json({ results: [] });
  }
}
`;

fs.writeFileSync('src/app/api/search/route.ts', code);
console.log('src/app/api/search/route.ts updated');
