## 2024-03-24 - Missing ARIA Labels on Icon-only Buttons
**Learning:** Found several buttons in `src/components/Sidebar.tsx` that use icons without any text labels. This makes them inaccessible to screen readers, which is a critical UX and accessibility issue for those relying on assistive technologies. The components often rely on tooltips for sighted users but lack `aria-label`s.
**Action:** Always ensure icon-only buttons have an `aria-label` attribute describing their function clearly (e.g. "Collapse Sidebar", "Login with Google") to improve accessibility.
