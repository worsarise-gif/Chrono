## 2024-05-14 - Missing ARIA Labels on Modals and Mobile Menus
**Learning:** Discovered a consistent pattern of missing `aria-label`s on icon-only buttons, specifically modal close buttons (e.g., Settings, Profile, Chat History) and the mobile navigation menu button. This severely hinders screen reader accessibility, as the purpose of these buttons cannot be inferred from content.
**Action:** Always verify that every `button` containing only icons or visual elements has an explicit `aria-label` describing its action, especially in common UI patterns like modals and responsive menus.
