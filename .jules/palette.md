## 2025-02-23 - Dynamic ARIA Labels vs Visual Text
**Learning:** When adding `aria-label` to elements that already contain dynamic visual text (like state indicators), the label must dynamically include that state text to prevent overriding the accessible name and causing a WCAG 2.5.3 (Label in Name) violation.
**Action:** Always ensure `aria-label` includes the visually presented text string using template literals (e.g. `aria-label={\`Select chat mode, currently \${modeLabels[mode]}\`}`).
