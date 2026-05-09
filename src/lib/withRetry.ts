export async function withRetry<T>(
  fn: () => Promise<T>,
  { maxAttempts = 3, baseDelayMs = 500 } = {}
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number })?.status;
      if ((status !== 429 && status !== 503 && status !== 502) || attempt === maxAttempts - 1) throw err;
      await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, attempt) + Math.random() * 200));
    }
  }
  throw lastError;
}

export function isRateLimitError(err: unknown): boolean {
  const s = (err as { status?: number })?.status;
  return s === 429 || s === 503;
}
