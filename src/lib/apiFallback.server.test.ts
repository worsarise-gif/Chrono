import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { getApiKeys, isQuotaOrAuthError, isFallbackError, withFallback } from './apiFallback.server';

describe('apiFallback.server', () => {
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    // Clear relevant env vars
    const keysToClear = [
      'GEMINI_API_KEY', 'GEMINI_API_KEY_SECONDARY', 'GEMINI_API_KEY_TERTIARY',
      'GROQ_API_KEY', 'GROQ_API_KEY_SECONDARY', 'GROQ_API_KEY_TERTIARY',
      'CEREBRAS_API_KEY', 'CEREBRAS_API_KEY_SECONDARY', 'CEREBRAS_API_KEY_TERTIARY',
      'TAVILY_API_KEY', 'TAVILY_API_KEY_SECONDARY', 'TAVILY_API_KEY_TERTIARY',
      'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN',
      'CLOUDFLARE_ACCOUNT_ID_SECONDARY', 'CLOUDFLARE_API_TOKEN_SECONDARY',
      'CLOUDFLARE_ACCOUNT_ID_TERTIARY', 'CLOUDFLARE_API_TOKEN_TERTIARY',
      'GOOGLE_API_KEY', 'GOOGLE_CX',
      'GOOGLE_API_KEY_SECONDARY', 'GOOGLE_CX_SECONDARY',
      'GOOGLE_API_KEY_TERTIARY', 'GOOGLE_CX_TERTIARY'
    ];
    keysToClear.forEach(key => delete process.env[key]);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('getApiKeys', () => {
    test('retrieves gemini keys', () => {
      process.env.GEMINI_API_KEY = 'key1';
      process.env.GEMINI_API_KEY_TERTIARY = 'key3';
      const keys = getApiKeys('gemini');
      assert.deepStrictEqual(keys, ['key1', 'key3']);
    });

    test('retrieves groq keys', () => {
      process.env.GROQ_API_KEY = 'groq1';
      process.env.GROQ_API_KEY_SECONDARY = 'groq2';
      const keys = getApiKeys('groq');
      assert.deepStrictEqual(keys, ['groq1', 'groq2']);
    });

    test('retrieves cloudflare keys', () => {
      process.env.CLOUDFLARE_ACCOUNT_ID = 'acc1';
      process.env.CLOUDFLARE_API_TOKEN = 'tok1';
      process.env.CLOUDFLARE_ACCOUNT_ID_SECONDARY = 'acc2';
      // Missing token for secondary
      const keys = getApiKeys('cloudflare');
      assert.deepStrictEqual(keys, [{ accountId: 'acc1', token: 'tok1' }]);
    });

    test('retrieves googleSearch keys', () => {
      process.env.GOOGLE_API_KEY = 'gkey1';
      process.env.GOOGLE_CX = 'cx1';
      const keys = getApiKeys('googleSearch');
      assert.deepStrictEqual(keys, [{ key: 'gkey1', cx: 'cx1' }]);
    });
  });

  describe('isQuotaOrAuthError', () => {
    test('identifies quota error by status 429', () => {
      assert.strictEqual(isQuotaOrAuthError({ status: 429 }), true);
    });

    test('identifies auth error by status 401', () => {
      assert.strictEqual(isQuotaOrAuthError({ response: { status: 401 } }), true);
    });

    test('identifies error by message content', () => {
      assert.strictEqual(isQuotaOrAuthError({ message: 'Rate limit exceeded' }), true);
      assert.strictEqual(isQuotaOrAuthError({ message: 'insufficient quota' }), true);
    });

    test('returns false for other errors', () => {
      assert.strictEqual(isQuotaOrAuthError({ status: 400 }), false);
      assert.strictEqual(isQuotaOrAuthError({ message: 'Internal Server Error' }), false);
    });
  });

  describe('isFallbackError', () => {
    test('includes quota errors', () => {
      assert.strictEqual(isFallbackError({ status: 429 }), true);
    });

    test('identifies server errors', () => {
      assert.strictEqual(isFallbackError({ status: 500 }), true);
      assert.strictEqual(isFallbackError({ status: 503 }), true);
    });

    test('identifies network errors', () => {
      assert.strictEqual(isFallbackError({ message: 'Failed to fetch' }), true);
      assert.strictEqual(isFallbackError({ message: 'Network error' }), true);
    });
  });


  });
