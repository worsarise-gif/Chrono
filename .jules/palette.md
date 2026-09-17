## 2024-11-20 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only interactive elements like modal close buttons, image upload buttons, and mobile navigation menus frequently lack descriptive ARIA labels, creating a poor experience for screen reader users who cannot deduce the button's purpose visually.
**Action:** Always verify that icon-only buttons (`<button><Icon /></button>`) explicitly include a descriptive `aria-label` attribute during component implementation.
