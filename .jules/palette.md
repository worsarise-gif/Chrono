
## 2023-11-20 - Ensure accessible modal close buttons
**Learning:** Found a common pattern of missing `aria-label` attributes on icon-only close buttons in full-screen/modal components like `SettingsModal` and `ProfileModal`, which creates an inaccessible experience for screen reader users as they wouldn't understand the purpose of the button.
**Action:** Always add an explicit `aria-label` (like `aria-label="Close settings"`) when rendering an icon-only interactive element such as `<button><X size={20} /></button>`.
