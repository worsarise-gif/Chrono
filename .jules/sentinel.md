## 2025-02-14 - Fix Missing Authentication on Search API
**Vulnerability:** The `/api/search/route.ts` endpoint lacked an authentication check, meaning any unauthenticated user or script could query the search endpoint without providing a valid session.
**Learning:** Even if `verifySession` is imported, it must be explicitly invoked at the beginning of the route's request handler. The `route.ts` had the `import { verifySession } from '@/lib/auth';` line (before the change), but the function was never called.
**Prevention:** Review all sensitive Next.js serverless API routes to ensure they explicitly call `await verifySession(req)` and return a `401 Unauthorized` response if the session is invalid.
