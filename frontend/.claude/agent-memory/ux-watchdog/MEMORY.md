# Court Vision UX Watchdog — Persistent Memory

## Design System Conventions (confirmed)

- Palette: `--bg-base: #06090E`, accent amber `--accent: #E8A030`, teal `--teal: #2DD4BF`
- Semantic colors: `--positive: #4ADE80`, `--negative: #F87171`
- Hardcoded hex values `#4ADE80`, `#F87171`, `#E8A030` appear throughout components as direct color values — they match CSS tokens exactly, so flag as a style-system smell but not a visual regression
- Fonts: `--font-display: Syne`, `--font-body: Outfit`, `--font-mono: DM Mono`
- `.section-label`: 0.67rem, 600 weight, uppercase, 0.18em letter-spacing, `var(--text-muted)`
- `.stat-table th`: right-aligned, sorted column gets `var(--accent)` via `.sorted` class
- `.stat-table td:first-child`: left-aligned, uses `var(--font-body)` not mono

## Established Interaction Patterns

- Sidebar stat-group toggle: column flex, amber active state (accent-dim bg, accent-glow border, accent text), 7px 12px padding, var(--radius)
- Conference filter buttons: column flex, gap 2px, transparent border when inactive, amber when active. Inline onMouseEnter/Leave for hover brightening. This is the pattern for both LeaderboardPage and TeamsPage.
- Pagination: btn-ghost "← Prev" / "Next →", opacity 0.3 when disabled (not the HTML `disabled` attribute alone)
- Sort indicators: plain text " ↑" / " ↓" appended to header content, not a separate icon component

## Component Architecture Notes

- `BpmBar` (LeaderboardPage) and `NetRtgBar` (TeamsPage) are parallel implementations — NOT shared. Both use inline hex colors matching tokens.
- `PercentileBar` is duplicated between `PlayerProfilePage.jsx` and `TeamProfilePage.jsx`. Player version: 4px bar height, 1rem value font. Team version: 3px bar height, 0.92rem value font. This is a known inconsistency — flag if it diverges further.
- `StatCard` is also duplicated between PlayerProfilePage and TeamProfilePage with near-identical code. The team version adds an `accent` prop.
- No shared component library yet — all reusable UI is copy-pasted per page.

## Known Intentional Design Decisions (do not flag)

- High data density on LeaderboardPage and TeamsPage is intentional for analyst users
- No Framer Motion used on TeamsPage or TeamProfilePage — static table/card layout is intentional
- The `repeat(auto-fit, minmax(110px, 1fr))` stat cards grid is intentional; no responsive breakpoint for narrow viewports is a pre-existing pattern consistent across pages
- Two-column `1fr 1fr` grid for percentile bars + chart has no mobile breakpoint — pre-existing behavior, not a new regression

## Recurring Issues to Watch

- Shared components re-implemented per page instead of extracted: PercentileBar, StatCard, BpmBar/NetRtgBar
- Inline `onMouseEnter`/`onMouseLeave` used for hover state instead of CSS — consistent but brittle if tokens change
- Search input placeholder text: must reflect all result types the field actually searches. Confirmed regression when Teams search was added but placeholder stayed "Search players..."
- Breadcrumb parent links lack hover feedback (no onMouseEnter/Leave), unlike other button elements in the app
- `aria-hidden="true"` missing on decorative separator characters (e.g., `›` in breadcrumbs)

## File Map (key files)

- Design tokens: `/Users/lucas/cbb-analytics/frontend/src/index.css`
- App router: `/Users/lucas/cbb-analytics/frontend/src/App.jsx`
- LeaderboardPage: `/Users/lucas/cbb-analytics/frontend/src/pages/LeaderboardPage.jsx`
- PlayerProfilePage: `/Users/lucas/cbb-analytics/frontend/src/pages/PlayerProfilePage.jsx`
- TeamsPage: `/Users/lucas/cbb-analytics/frontend/src/pages/TeamsPage.jsx`
- TeamProfilePage: `/Users/lucas/cbb-analytics/frontend/src/pages/TeamProfilePage.jsx`
- Navigation: `/Users/lucas/cbb-analytics/frontend/src/components/Navigation.jsx`
- Mock data: `/Users/lucas/cbb-analytics/frontend/src/data/mockData.js`
