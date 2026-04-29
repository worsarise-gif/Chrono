## 2026-04-29 - [Missing ARIA labels on Icon-only buttons]
**Learning:** The application has a large number of icon-only buttons (like those in Sidebar, ChatArea, AuthPage) that lack proper `aria-label` attributes, presenting a significant accessibility issue for screen-reader users. Some components do use `title` tags, but ARIA labels are specifically required by the prompt's UX Coding Standards.
**Action:** Add `aria-label` attributes to these icon-only buttons, specifically starting with the Sidebar components where expand/collapse actions exist.
