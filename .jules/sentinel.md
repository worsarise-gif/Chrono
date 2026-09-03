## 2024-05-24 - Missing Authentication Check on Search API
**Vulnerability:** The `/api/search` POST endpoint was missing an authentication check (`verifySession`), allowing unauthenticated users to execute vector and web searches, potentially consuming API quotas and exposing internal capabilities.
**Learning:** Even internal utility endpoints need explicit session verification if they perform backend operations. Next.js App Router API routes are completely public by default unless protected at the route level or via middleware.
**Prevention:** Always verify incoming requests in sensitive API routes (e.g., using `await verifySession(req)`) and ensure the necessary authentication module is imported (e.g., `import { verifySession } from '@/lib/auth';`) before merging.
