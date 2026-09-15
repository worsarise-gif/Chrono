## 2024-05-24 - Dynamic ARIA Labels for State-Based Selectors
**Learning:** When adding `aria-label` to elements with dynamic visual text (like a mode selector), the ARIA label MUST include that dynamic state text to avoid overriding the accessible name and causing a WCAG 2.5.3 (Label in Name) regression.
**Action:** Always ensure `aria-label` incorporates the exact visible text of the element when updating accessibility for stateful components.
