## 2024-05-24 - Missing ARIA labels on Chat icon buttons
**Learning:** The ChatArea component uses many icon-only buttons (like Menu, Edit, Copy, New Chat) which often rely on `title` attributes for tooltips or have no descriptive text at all, making them inaccessible to screen readers.
**Action:** Always ensure icon-only buttons have explicit `aria-label` attributes to provide context for assistive technologies.
