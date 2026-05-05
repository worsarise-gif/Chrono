import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { getApiKeys, isQuotaOrAuthError, isFallbackError, withFallback } from './apiFallback.server.ts';

describe('apiFallback.server', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
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

  describe('withFallback', () => {
    test('returns result on first successful call', async () => {
      const operation = mock.fn(async (key) => `success with ${key}`);
      const result = await withFallback(['S1', 'S2'], operation);
      assert.strictEqual(result, 'success with S1');
      assert.strictEqual(operation.mock.callCount(), 1);
    });

    test('falls back to second key on fallback error', async () => {
      let firstCall = true;
      const operation = mock.fn(async (key) => {
        if (firstCall) {
          firstCall = false;
          throw { status: 503, message: 'Service Unavailable' };
        }
        return `success with ${key}`;
      });
      const result = await withFallback(['F1', 'F2'], operation);
      assert.strictEqual(result, 'success with F2');
      assert.strictEqual(operation.mock.callCount(), 2);
    });

    test('throws immediately on client error (400)', async () => {
      const operation = mock.fn(async () => {
        throw { status: 400, message: 'Bad Request' };
      });
      await assert.rejects(withFallback(['C1', 'C2'], operation), { status: 400 });
      assert.strictEqual(operation.mock.callCount(), 1);
    });

    test('circuit breaker bans key on quota error', async () => {
      const keys = ['CB1', 'CB2'];
      let shouldFail = true;

      const operation = mock.fn(async (key) => {
        if (key === 'CB1' && shouldFail) {
          throw { status: 429, message: 'Too Many Requests' };
        }
        return `success with ${key}`;
      });

      // First call fails for CB1, falls back to CB2
      const res1 = await withFallback(keys, operation);
      assert.strictEqual(res1, 'success with CB2');
      assert.strictEqual(operation.mock.callCount(), 2);

      // Second call should skip CB1 because it's banned
      shouldFail = false;
      const res2 = await withFallback(keys, operation);
      assert.strictEqual(res2, 'success with CB2');
      assert.strictEqual(operation.mock.callCount(), 3);

      assert.strictEqual(operation.mock.calls[2].arguments[0], 'CB2');
    });

    test('throws error if all keys fail', async () => {
      const operation = mock.fn(async () => {
        throw { status: 500, message: 'Persistent failure' };
      });
      await assert.rejects(withFallback(['A1', 'A2'], operation), { message: 'Persistent failure' });
      assert.strictEqual(operation.mock.callCount(), 2);
    });
  });
});
