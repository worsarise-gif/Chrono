## 2026-09-02 - Adding Accessible Names to Icon-only Buttons
**Learning:** When using lucide-react icons or similar inside button components, the visual icon alone is insufficient for screen readers. Buttons like Edit, Copy, or Close Modals need semantic names for accessibility.
**Action:** Always add an explicit `aria-label` to icon-only `<button>` elements. Specifically implemented across Modals (Close) and Chat actions (Edit/Copy).
