## 2024-07-28 - ARIA Labels on Icon-Only Buttons
**Learning:** This application heavily utilizes icon-only buttons for actions like chat navigation, toggling sidebars, and message options (e.g., in `ChatArea.tsx`). While visually clean, these buttons are completely opaque to screen readers without an accessible name.
**Action:** When adding new icon-only buttons, always include a descriptive `aria-label` attribute to ensure screen reader users can understand the button's purpose.
