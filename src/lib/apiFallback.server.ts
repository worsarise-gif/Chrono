export const getApiKeys = (provider: 'gemini' | 'groq' | 'cerebras' | 'cloudflare' | 'tavily' | 'googleSearch' | 'cloudflare_vectorize'): any[] => {
  switch (provider) {
    case 'gemini':
      return [
        process.env.GEMINI_API_KEY,
        process.env.GEMINI_API_KEY_SECONDARY,
        process.env.GEMINI_API_KEY_TERTIARY
      ].filter(Boolean) as string[];
    case 'groq':
      return [
        process.env.GROQ_API_KEY,
        process.env.GROQ_API_KEY_SECONDARY,
        process.env.GROQ_API_KEY_TERTIARY
      ].filter(Boolean) as string[];
    case 'cerebras':
      return [
        process.env.CEREBRAS_API_KEY,
        process.env.CEREBRAS_API_KEY_SECONDARY,
        process.env.CEREBRAS_API_KEY_TERTIARY
      ].filter(Boolean) as string[];
    case 'tavily':
      return [
        process.env.TAVILY_API_KEY,
        process.env.TAVILY_API_KEY_SECONDARY,
        process.env.TAVILY_API_KEY_TERTIARY
      ].filter(Boolean) as string[];
    case 'cloudflare':
      return [
        { accountId: process.env.CLOUDFLARE_ACCOUNT_ID, token: process.env.CLOUDFLARE_API_TOKEN },
        { accountId: process.env.CLOUDFLARE_ACCOUNT_ID_SECONDARY, token: process.env.CLOUDFLARE_API_TOKEN_SECONDARY },
        { accountId: process.env.CLOUDFLARE_ACCOUNT_ID_TERTIARY, token: process.env.CLOUDFLARE_API_TOKEN_TERTIARY }
      ].filter(k => k.accountId && k.token);
    case 'googleSearch':
      return [
        { key: process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY, cx: process.env.GOOGLE_CX || process.env.GOOGLE_CX },
        { key: process.env.GOOGLE_API_KEY_SECONDARY || process.env.GOOGLE_API_KEY_SECONDARY, cx: process.env.GOOGLE_CX_SECONDARY || process.env.GOOGLE_CX_SECONDARY },
        { key: process.env.GOOGLE_API_KEY_TERTIARY || process.env.GOOGLE_API_KEY_TERTIARY, cx: process.env.GOOGLE_CX_TERTIARY || process.env.GOOGLE_CX_TERTIARY }
      ].filter(k => k.key && k.cx);
    case 'cloudflare_vectorize':
      return [
        { accountId: process.env.CLOUDFLARE_ACCOUNT_ID, token: process.env.CLOUDFLARE_API_TOKEN, indexName: process.env.CLOUDFLARE_VECTORIZE_INDEX_NAME },
        { accountId: process.env.CLOUDFLARE_ACCOUNT_ID_SECONDARY, token: process.env.CLOUDFLARE_API_TOKEN_SECONDARY, indexName: process.env.CLOUDFLARE_VECTORIZE_INDEX_NAME_SECONDARY },
        { accountId: process.env.CLOUDFLARE_ACCOUNT_ID_TERTIARY, token: process.env.CLOUDFLARE_API_TOKEN_TERTIARY, indexName: process.env.CLOUDFLARE_VECTORIZE_INDEX_NAME_TERTIARY }
      ].filter(k => k.accountId && k.token && k.indexName);

  }
  return [];
};

export const isQuotaOrAuthError = (error: any) => {
  const msg = error?.message?.toLowerCase() || '';
  const status = error?.status || error?.response?.status;
  return (
    status === 429 ||
    status === 403 ||
    status === 401 ||
    msg.includes('quota') ||
    msg.includes('limit') ||
    msg.includes('too many requests') ||
    msg.includes('rate limit') ||
    msg.includes('exhausted')
  );
};

import { db } from './firebaseAdmin';

export const isFallbackError = (error: any) => {
  const msg = error?.message?.toLowerCase() || '';
  const status = error?.status || error?.response?.status;
  return (
    isQuotaOrAuthError(error) ||
    status === 500 ||
    status === 503 ||
    status === 502 ||
    msg.includes('failed to fetch') ||
    msg.includes('network error')
  );
};

// Circuit Breaker State (Firestore)
const BAN_DURATION_MS = 60 * 1000; // 60 seconds

const getKeyId = (key: any): string => {
  if (typeof key === 'string') return key;
  try {
    return JSON.stringify(key);
  } catch {
    return String(key);
  }
};

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const isKeyBanned = async (keyIdRaw: string): Promise<boolean> => {
  try {
    const keyId = await sha256(keyIdRaw);
    const docRef = db.collection('circuit_breaker_bans').doc(keyId);
    const doc = await docRef.get();
    if (doc.exists) {
      const data = doc.data();
      if (data && data.expiresAt) {
        if (Date.now() < data.expiresAt) {
          return true; // Still banned
        }
      }
    }
  } catch (e) {
    console.error("Error reading key ban status from Firestore", e);
  }
  return false;
};

export const banKey = async (keyIdRaw: string): Promise<void> => {
  try {
    const keyId = await sha256(keyIdRaw);
    const docRef = db.collection('circuit_breaker_bans').doc(keyId);
    await docRef.set({
      expiresAt: Date.now() + BAN_DURATION_MS,
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.error("Error writing key ban to Firestore", e);
  }
};

export const withFallback = async <T>(
  keys: any[],
  operation: (key: any) => Promise<T>,
  addLog?: (type: 'info' | 'error' | 'warning' | 'success', component: string, message: string, details?: any) => void,
  explicitKeyIndex?: number
): Promise<T> => {
  if (!keys || keys.length === 0) {
    if (addLog) addLog('error', 'API Fallback', 'No API keys available');
    throw new Error("No API keys available for this provider.");
  }

  // Filter out keys that are currently banned concurrently
  const banChecks = await Promise.all(keys.map(async k => ({
    key: k,
    banned: await isKeyBanned(getKeyId(k))
  })));
  
  let availableKeys = banChecks.filter(check => !check.banned).map(check => check.key);

  if (explicitKeyIndex !== undefined) {
    if (explicitKeyIndex < 0 || explicitKeyIndex >= keys.length) {
      if (addLog) addLog('error', 'API Fallback', 'Explicit key index out of bounds');
      throw new Error("Specified API tier is not available.");
    }
    const explicitKey = keys[explicitKeyIndex];
    if (await isKeyBanned(getKeyId(explicitKey))) {
      if (addLog) addLog('error', 'API Fallback', 'Explicit key is currently circuit-broken');
      throw new Error("The specified API key tier is currently circuit-broken.");
    }
    availableKeys = [explicitKey];
  }

  // If all keys are banned, throw immediately to trigger higher-level fallback
  if (availableKeys.length === 0) {
    if (addLog) addLog('error', 'API Fallback', 'All keys are currently circuit-broken');
    console.warn("All keys are currently circuit-broken. Throwing to trigger provider fallback.");
    throw new Error("All API keys for this provider have reached their usage limits or are temporarily blocked.");
  }

  let lastError: any;
  for (let i = 0; i < availableKeys.length; i++) {
    const currentKey = availableKeys[i];
    try {
      if (addLog) addLog('info', 'API Fallback', `Attempting API call with key index ${i}`);
      const result = await operation(currentKey);
      if (addLog) addLog('success', 'API Fallback', `API call successful with key index ${i}`);
      return result;
    } catch (error: any) {
      lastError = error;
      console.warn(`API call failed with key index ${i}. Error:`, error?.message || error);
      if (addLog) addLog('warning', 'API Fallback', `API call failed with key index ${i}`, { error: error?.message || String(error) });
      
      if (isFallbackError(error)) {
        // Only break the circuit for this key if it's a quota or auth error
        if (isQuotaOrAuthError(error)) {
          const keyId = getKeyId(currentKey);
          await banKey(keyId);
          console.warn(`Circuit broken for key. Banned for 60s.`);
          if (addLog) addLog('warning', 'API Fallback', `Circuit broken for key index ${i}. Banned for 60s.`);
        } else {
          console.warn(`Server error encountered. Trying next key without banning...`);
        }

        // If it's the last available key, don't bother continuing
        if (i === availableKeys.length - 1) {
          break;
        }

        console.warn(`Falling back to next available key...`);
        if (addLog) addLog('info', 'API Fallback', `Falling back to next available key...`);
        continue;
      } else {
        const status = error?.status || error?.response?.status;
        if (status === 400 || status === 413) {
          console.warn(`Client error ${status} encountered. Throwing immediately...`);
          if (addLog) addLog('error', 'API Fallback', `Client error ${status} encountered. Throwing immediately...`);
          throw error;
        }

        // If it's a generic error, falling back won't help
        if (i === availableKeys.length - 1) {
          break;
        }
        console.warn(`Error is not quota/limit related, but falling back anyway to be safe...`);
        if (addLog) addLog('info', 'API Fallback', `Error is not quota/limit related, but falling back anyway to be safe...`);
        continue;
      }
    }
  }
  if (addLog) addLog('error', 'API Fallback', 'All fallback attempts failed', { error: lastError?.message || String(lastError) });
  throw lastError;
};
