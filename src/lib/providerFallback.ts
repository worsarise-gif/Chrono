import { isRateLimitError } from './withRetry';

type ProviderFn<T> = () => Promise<T>;

export async function withProviderFallback<T>(providers: ProviderFn<T>[]): Promise<T> {
  let lastError: unknown;
  for (const provider of providers) {
    try {
      return await provider();
    } catch (err) {
      if (isRateLimitError(err)) { lastError = err; continue; }
      throw err;
    }
  }
  throw lastError;
}
