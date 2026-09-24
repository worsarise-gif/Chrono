## 2024-09-24 - Modal Close Buttons Accessibility Pattern
**Learning:** Found that close buttons (X icon) in modals (`SettingsModal.tsx`, `ProfileModal.tsx`) across this app were missing `aria-label`s for screen readers and did not have explicit keyboard focus indicators (`focus-visible` states), which are critical for accessibility.
**Action:** Always verify that all icon-only interactive elements in modals and dropdowns have explicit `aria-label`s and `focus-visible` utility classes applied to them when adding or modifying them.
