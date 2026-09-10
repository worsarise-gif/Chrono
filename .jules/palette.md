## 2024-05-19 - Improved Accessibility in Modals
**Learning:** Found instances in SettingsModal and ProfileModal where icon-only buttons (like close buttons or camera edit icons) were missing explicit `aria-label`s and lacked dedicated keyboard focus states, hindering accessibility for keyboard and screen reader users.
**Action:** Implemented semantic `aria-label`s and standard Tailwind `focus-visible` ring styles to ensure interactive elements are fully accessible. Introduced visual loading state for the "Save Prompt" button to provide immediate user feedback during async operations.
