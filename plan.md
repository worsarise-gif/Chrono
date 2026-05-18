1. **TypeScript Definitions & Setup**
   - Create `src/types/index.ts` containing the following types: `MockChat`, `MockMessage`, `MockImage`, `ThemeMode` (import and extract from ThemeContext or recreate), `ThemeColors` (typeof colors.light).
   - Update `src/mock/chats.ts`, `src/mock/messages.ts`, and `src/mock/images.ts` to import these shared types.
   - Run `npx tsc --noEmit` and fix any other implicit `any` types (e.g., in MessageList or Sidebar).

2. **Implement Home Screen (`app/(app)/index.tsx`)**
   - Render a layout centered vertically and horizontally.
   - Top-left header needs a drawer open button (PanelLeft icon).
   - Add a rotating `ChronoLogo` if `!useReducedMotion()`.
   - Add headings: "How can I help you today?" and "Ask me anything."
   - Create a suggestion chip grid with Atom, Code, Calculator, and Image icons.
     - Chip values: "Explain quantum computing", "Write a Python web scraper", "Solve this equation: x² + 5x + 6 = 0", "Summarize an image I upload"
   - Include `ChatInput` pinned to the bottom.
   - When sending a message, navigate to `/(app)/chat/new-chat-${Date.now()}`.
   - Add `FadeIn` (entering) animations to chips with staggered delays.

3. **Implement Gallery Screen (`app/(app)/gallery.tsx`)**
   - Read images from `MOCK_IMAGES`. Use a `FlatList` with `numColumns={2}`.
   - Each cell uses `expo-image` and has a `FadeIn` animation with index stagger.
   - Include empty state when `MOCK_IMAGES` is empty.
   - Add a full-screen Lightbox `Modal` on press, featuring:
     - `PinchGestureHandler` for zoom, `PanGestureHandler` to swipe down to close.
     - Dark background, prompt text, date, and share/close buttons.
   - Add a pull-to-refresh showing an 8-skeleton grid for 1.5s.

4. **Implement Settings Screen (`app/(app)/settings.tsx` & `src/components/settings/SettingsRow.tsx`)**
   - Create `SettingsRow` component handling layout, text, icons, and right element.
   - Make a `SectionList` in Settings for Profile, Appearance, AI Preferences, Notifications, Data, Account, and Danger Zone.
   - Handle theme switching using a custom segmented control.
   - Implement simple `Alert.alert` dialogs for Clear Chats, Sign Out (with context update to `setIsAuthenticated(false)`), and Delete Account (2-step).

5. **Animation & Accessibility Audit**
   - Make sure all screens use `FadeIn` entering containers.
   - Check standard components (Button, IconButton) have accessibility roles/labels and minimum touch targets (44x44).
   - Sidebar list items need `FadeInLeft` delays.
   - Ensure `useReducedMotion()` is checked properly across the app (disabling `withTiming`, `withSpring`, `withRepeat`).
   - Add Haptic feedback.

6. **Platform-Specific Polish**
   - Settings Screen uses iOS `headerLargeTitle`.
   - Android back handler integration in chat screen (using `BackHandler` from react-native instead of react-native-back-handler since the lib isn't finding it, or use `expo-router` useFocusEffect back handler).
   - Android ripple on all Pressables.
   - Expo system UI background color async on theme change.
   - Status bar style matching theme.

7. **Documentation & Validation**
   - Write `MOBILE_UI.md`.
   - Pre-commit check ("Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.").
   - Ensure `tsc --noEmit` passes cleanly.
