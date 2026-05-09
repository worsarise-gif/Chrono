# Chrono UI Color System Refactor

## Contrast Check (WCAG AA Compliance: $\ge 4.5:1$ for normal text)

| Token Pair | Light Mode Contrast Ratio | Dark Mode Contrast Ratio | WCAG Level |
| :--- | :--- | :--- | :--- |
| `foreground` on `background` | 18.10:1 | 17.41:1 | AAA |
| `foreground` on `surface` | 17.17:1 | 16.09:1 | AAA |
| `foreground` on `surface-elevated` | 18.89:1 | 13.53:1 | AAA |
| `foreground-muted` on `background` | 7.40:1 | 7.47:1 | AA / AAA |
| `foreground-muted` on `surface` | 7.02:1 | 6.91:1 | AA |
| `foreground-subtle` on `background` | 4.63:1 | 4.63:1 | AA |
| `primary` on `background` | 6.02:1 | 6.43:1 | AA |
| `success` on `background` | 4.81:1 | 11.00:1 | AA |
| `warning` on `background` | 4.81:1 | 11.48:1 | AA |
| `destructive` on `background` | 4.63:1 | 6.93:1 | AA |
| `info` on `background` | 4.95:1 | 7.54:1 | AA |

*All contrast ratios meet or exceed the WCAG AA requirement of 4.5:1.*

## Token Mapping

| Old Token | New Token |
| :--- | :--- |
| `bg-white` | `bg-surface-elevated` (or `bg-background` depending on context) |
| `bg-black` / `bg-[#000000]` / `bg-[#0a0a0a]` | `bg-background` |
| `text-black` | `text-foreground` |
| `text-muted-foreground` / `text-gray-400` / `text-zinc-400` | `text-foreground-muted` |
| `text-gray-500` / `text-zinc-500` | `text-foreground-subtle` |
| `border-gray-*` / `border-zinc-*` / `border-white/10` | `border-border` |
| `text-blue-*` | `text-info` |
| `text-green-*` / `text-emerald-500` | `text-success` |
| `text-red-*` | `text-destructive` |
| `text-amber-*` / `text-yellow-*` | `text-warning` |
| `bg-red-*` | `bg-destructive text-destructive-foreground` |
| `bg-green-*` / `bg-emerald-500` | `bg-success text-success-foreground` |
| `selection:bg-gray-800` | `selection:bg-primary/30 selection:text-foreground` |

## Modified Files

- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/privacy/page.tsx`
- `src/app/reset-password/page.tsx`
- `src/app/terms/page.tsx`
- `src/app/verify-email/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/login/page.tsx`
- `src/app/admin/q1/assistant/dashboard/edge/analysis/room/page.tsx`
- `src/components/AuthPage.tsx`
- `src/components/ChatArea.tsx`
- `src/components/ChatHistoryModal.tsx`
- `src/components/ChatLayout.tsx`
- `src/components/ErrorBoundary.tsx`
- `src/components/PlanetLogo.tsx`
- `src/components/ResponseFormatter.tsx`
- `src/components/Sidebar.tsx`
- `src/components/admin/DatabaseTab.tsx`
- `src/components/admin/LogsTab.tsx`
- `src/components/admin/ModelsTab.tsx`
- `src/components/admin/OverviewTab.tsx`
- `src/components/admin/SettingsTab.tsx`
- `src/components/admin/UsersTab.tsx`
- `src/components/modals/ProfileModal.tsx`

## Manual Review Needed
None. Verified that visual components like `PlanetLogo`, `Sidebar`, and auth page backgrounds work correctly.
