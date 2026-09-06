## 2025-05-24 - Missing ARIA Labels on Icon-only Buttons
**Learning:** Found several icon-only buttons in the main chat component (`ChatArea.tsx`) that use `title` attributes but lack `aria-label`s, which is an accessibility anti-pattern.
**Action:** Add `aria-label` attributes corresponding to the `title` text for icon-only buttons to ensure they are accessible to screen readers.
