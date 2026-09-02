## 2026-09-02 - Missing Authentication on Search API Route
**Vulnerability:** The `/api/search` endpoint was completely unauthenticated, allowing anyone to bypass the frontend and query the internal vector search and legacy web search endpoints directly.
**Learning:** All sensitive Next.js serverless API routes must explicitly authenticate requests by calling `await verifySession(req)` from `src/lib/auth.ts` and returning a 401 response if the session is invalid, ensuring unauthorized access is blocked.
**Prevention:** Establish a standard template for new API routes that includes the `verifySession` check as the very first operation inside the main try/catch block.
