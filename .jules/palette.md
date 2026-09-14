
## 2024-09-14 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Found several critical icon-only interaction points (mobile menu toggle, modal close, inline edit save/cancel) that lacked `aria-label` attributes, rendering them inaccessible to screen readers.
**Action:** Always ensure `aria-label` or `title` is present on interactive elements that do not contain visible text content to support WCAG compliance.
