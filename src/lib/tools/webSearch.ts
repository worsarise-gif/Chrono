import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function webSearch(query: string): Promise<string> {
  try {
    const normalizedQuery = query.trim().toLowerCase();
    const docId = await sha256(normalizedQuery);
    const cacheRef = doc(db, 'search_cache', docId);

    // 1. Check Firestore Cache
    try {
      const cacheSnap = await getDoc(cacheRef);
      if (cacheSnap.exists()) {
        const cachedData = cacheSnap.data();
        if (cachedData && cachedData.created_at) {
          const createdAt = new Date(cachedData.created_at).getTime();
          const now = Date.now();
          const ageInHours = (now - createdAt) / (1000 * 60 * 60);

          // 72-hour TTL check
          if (ageInHours < 72) {
            return JSON.stringify(cachedData.results);
          }
        }
      }
    } catch (err) {
      console.warn('Firestore cache read failed:', err);
    }

    let results: SearchResult[] = [];
    let googleFailed = false;

    // 2. Primary Search: Google Custom Search API
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
    const googleCx = process.env.NEXT_PUBLIC_GOOGLE_CX || process.env.GOOGLE_CX;

    if (googleApiKey && googleCx) {
      try {
        const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(query)}&num=5`;
        const googleRes = await fetch(googleUrl);
        
        if (googleRes.status === 429) {
          googleFailed = true;
        } else if (googleRes.ok) {
          const googleData = await googleRes.json();
          if (googleData.items && googleData.items.length > 0) {
            results = googleData.items.slice(0, 5).map((item: any) => ({
              title: item.title,
              link: item.link,
              snippet: item.snippet,
            }));
          } else {
            googleFailed = true;
          }
        } else {
          googleFailed = true;
        }
      } catch (err) {
        console.warn('Google CSE failed:', err);
        googleFailed = true;
      }
    } else {
      googleFailed = true;
    }

    // 3. Fallback Search: Tavily API
    if (googleFailed || results.length === 0) {
      const tavilyApiKey = process.env.NEXT_PUBLIC_TAVILY_API_KEY || process.env.TAVILY_API_KEY;
      if (tavilyApiKey) {
        try {
          const tavilyRes = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              api_key: tavilyApiKey,
              query: query,
              search_depth: 'basic',
              max_results: 5,
            }),
          });

          if (tavilyRes.ok) {
            const tavilyData = await tavilyRes.json();
            if (tavilyData.results && tavilyData.results.length > 0) {
              results = tavilyData.results.map((item: any) => ({
                title: item.title,
                link: item.url,
                snippet: item.content,
              }));
            }
          }
        } catch (err) {
          console.warn('Tavily fallback failed:', err);
        }
      }
    }

    // If both failed or returned empty
    if (results.length === 0) {
      return "Search unavailable. Rely on training data.";
    }

    // 4. Formatting & Persistence
    try {
      // Save the new results into the cache
      await setDoc(cacheRef, {
        query: normalizedQuery,
        results: results,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Firestore cache write failed:', err);
    }

    return JSON.stringify(results);
  } catch (error) {
    console.error('Web search tool error:', error);
    return "Search unavailable. Rely on training data.";
  }
}
