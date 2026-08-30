## 2025-02-28 - Icon-Only Button ARIA Labels
**Learning:** Found several core interactive icon-only buttons in `ChatArea.tsx` (like "Regenerate", "Upvote", "Attach Image") lacking `aria-label` attributes, relying solely on `title` which is insufficient for screen readers.
**Action:** Ensure all icon-only buttons receive descriptive `aria-label` attributes alongside `title` to maintain accessibility standards.
