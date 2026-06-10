## 2025-02-27 - Added aria-labels to icon-only modal close buttons
**Learning:** Icon-only close buttons inside dynamically-rendered modals often lack proper accessibility traits, requiring explicit text for screen readers. Multiple custom modal components in this design system follow this exact pattern.
**Action:** Always verify custom modal close controls for `aria-label` attributes to ensure they're identifiable by assistive tech when creating or modifying them.
