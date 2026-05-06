"use server";
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { tavily } from '@tavily/core';
import firebaseConfigJson from '../../../firebase-applet-config.json';
import { getApiKeys, withFallback } from '../apiFallback.server';

// Firebase configuration: Prefer environment variables, fallback to JSON for AI Studio
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || firebaseConfigJson.appId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || firebaseConfigJson.measurementId,
};

const firestoreDatabaseId = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId || '(default)';

// Initialize Firebase (Server-side friendly)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app, firestoreDatabaseId);

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

function cleanSnippet(raw: string): string {
  if (!raw) return '';
  // Remove markdown links, images, etc (basic cleanup)
  let text = raw.replace(/\[.*?\]\(.*?\)/g, '');
  // Split into lines
  let lines = text.split('\n');
  
  // Filter lines:
  // 1. Must have at least 4 words OR be longer than 40 chars.
  // 2. Shouldn't be typical nav words (Home, Contact, About us, etc.)
  const navWords = /^(home|about|contact|menu|search|login|sign up|privacy policy|terms|topics|resources|guides|programs|categories|recent|api|learn|releases|plan|build|deploy|contribute|suggested|get started|core concepts|agents|tools|run and scale|evaluation|model optimization|specialized models|going live|legacy apis|using codex|configuration|administration|automation)$/i;
  
  lines = lines.filter(line => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return false;
    if (navWords.test(trimmed)) return false;
    const wordCount = trimmed.split(/\s+/).length;
    return wordCount >= 4 || trimmed.length > 40;
  });
  
  // Join with space and normalize whitespace
  let cleaned = lines.join(' ').replace(/\s+/g, ' ').trim();
  
  // Truncate to 300 chars to keep UI clean
  if (cleaned.length > 300) {
    cleaned = cleaned.substring(0, 300).trim() + '...';
  }
  return cleaned;
}

export async function legacyWebSearch(query: string, forceRefresh: boolean = false): Promise<string> {
  try {
    const normalizedQuery = query.trim().toLowerCase();
    const docId = await sha256(normalizedQuery);
    const cacheRef = doc(db, 'search_cache', docId);

    // 1. Check Firestore Cache
    if (!forceRefresh) {
      try {
        const cacheSnap = await getDoc(cacheRef);
        if (cacheSnap.exists()) {
          const cachedData = cacheSnap.data();
          if (cachedData && cachedData.created_at) {
            const createdAt = new Date(cachedData.created_at).getTime();
            const now = Date.now();
            const ageInHours = (now - createdAt) / (1000 * 60 * 60);

            // Dynamic TTL check: 2 hours for time-sensitive, 24 hours for others
            const timeSensitiveKeywords = ['news', 'weather', 'stock', 'today', 'latest', 'now', 'current'];
            const isTimeSensitive = timeSensitiveKeywords.some(kw => normalizedQuery.includes(kw));
            const ttlHours = isTimeSensitive ? 2 : 24;

            if (ageInHours < ttlHours) {
              return JSON.stringify(cachedData.results);
            }
          }
        }
      } catch (err) {
        console.warn('Firestore cache read failed:', err);
      }
    }

    let results: SearchResult[] = [];
    let tavilyFailed = false;

    // 2. Primary Search: Tavily API
    const tavilyKeys = getApiKeys('tavily');
    
    try {
      results = await withFallback(tavilyKeys, async (tavilyApiKey) => {
        const client = tavily({ apiKey: tavilyApiKey });
        const tavilyData = await client.search(query, {
          searchDepth: "advanced",
          maxResults: 5
        });

        if (tavilyData && tavilyData.results && tavilyData.results.length > 0) {
          return tavilyData.results.map((item: any) => ({
            title: item.title,
            link: item.url,
            snippet: cleanSnippet(item.content),
          }));
        } else {
          throw new Error("No results from Tavily");
        }
      });
    } catch (err) {
      console.warn('Tavily search failed across all keys:', err);
      tavilyFailed = true;
    }

    // 3. Fallback Search: Google Custom Search API
    if (tavilyFailed || results.length === 0) {
      const googleKeys = getApiKeys('googleSearch');
      
      if (googleKeys.length > 0) {
        try {
          results = await withFallback(googleKeys, async (keyObj: any) => {
            const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${keyObj.key}&cx=${keyObj.cx}&q=${encodeURIComponent(query)}&num=5`;
            const googleRes = await fetch(googleUrl);
            
            if (!googleRes.ok) {
              throw new Error(`Google CSE failed with status: ${googleRes.status}`);
            }

            const googleData = await googleRes.json();
            if (googleData.items && googleData.items.length > 0) {
              return googleData.items.slice(0, 5).map((item: any) => ({
                title: item.title,
                link: item.link,
                snippet: cleanSnippet(item.snippet),
              }));
            } else {
              throw new Error("No results from Google CSE");
            }
          });
        } catch (err) {
          console.warn('Google CSE fallback failed across all keys:', err);
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
