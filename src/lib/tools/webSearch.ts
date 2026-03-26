import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { tavily } from '@tavily/core';
import firebaseConfigJson from '../../../firebase-applet-config.json';

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
    let tavilyFailed = false;

    // 2. Primary Search: Tavily API
    // Use the provided key as a fallback if the environment variable is missing
    const tavilyApiKey = process.env.TAVILY_API_KEY || process.env.NEXT_PUBLIC_TAVILY_API_KEY || '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';
    
    if (tavilyApiKey) {
      try {
        const client = tavily({ apiKey: tavilyApiKey });
        const tavilyData = await client.search(query, {
          searchDepth: "advanced",
          maxResults: 5
        });

        if (tavilyData && tavilyData.results && tavilyData.results.length > 0) {
          results = tavilyData.results.map((item: any) => ({
            title: item.title,
            link: item.url,
            snippet: item.content,
          }));
        } else {
          tavilyFailed = true;
        }
      } catch (err) {
        console.warn('Tavily primary search failed:', err);
        tavilyFailed = true;
      }
    } else {
      tavilyFailed = true;
    }

    // 3. Fallback Search: Google Custom Search API
    if (tavilyFailed || results.length === 0) {
      const googleApiKey = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      const googleCx = process.env.GOOGLE_CX || process.env.NEXT_PUBLIC_GOOGLE_CX;

      if (googleApiKey && googleCx) {
        try {
          const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(query)}&num=5`;
          const googleRes = await fetch(googleUrl);
          
          if (googleRes.ok) {
            const googleData = await googleRes.json();
            if (googleData.items && googleData.items.length > 0) {
              results = googleData.items.slice(0, 5).map((item: any) => ({
                title: item.title,
                link: item.link,
                snippet: item.snippet,
              }));
            }
          }
        } catch (err) {
          console.warn('Google CSE fallback failed:', err);
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
