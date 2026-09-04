
## $(date +%Y-%m-%d) - Adding ARIA Labels to Dynamic Selectors
**Learning:** When adding `aria-label` attributes to UI components with dynamic states (such as a chat mode selector dropdown), the `aria-label` should incorporate the dynamic visual text (e.g., `aria-label={"Select chat mode, currently " + modeLabels[mode]}`) to prevent WCAG 2.5.3 regression where the accessible name is overridden and loses the state information.
**Action:** Always check if a component has dynamic text state before assigning a static `aria-label`. Incorporate dynamic state into the aria label when applicable.
