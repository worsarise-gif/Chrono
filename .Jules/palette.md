## 2024-05-15 - Missing ARIA Labels on Icon Buttons
**Learning:** The project components (SettingsModal, ProfileModal) have icon-only close buttons lacking `aria-label` attributes, which hinders screen reader accessibility.
**Action:** Add `aria-label="Close"` to these modal buttons and maintain this standard.
