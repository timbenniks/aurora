# Phase 06b — Mobile responsiveness

**Status:** complete  
**Completed:** 2026-07-01  
**Priority:** before phase 07 (GitHub auth)  
**Depends on:** [phase-06](./phase-06-preview-ui.md)  
**Estimated scope:** medium–large

## Goal

Make Aurora usable on mobile — full-width content, drawer navigation, responsive spacing, and polished Launch/Preview flows for on-the-go agent kickoff.

## Acceptance criteria

- [x] At 390px, main content uses full viewport width
- [x] Menu opens/closes sidebar overlay; Escape / backdrop closes
- [x] No horizontal overflow on MVP routes
- [x] Launch: collapsible prompts, sticky Validate/Continue footer
- [x] Preview: scrollable tabs, sticky Create repository footer
- [x] Safe-area insets on header and sticky footers
- [x] Build passes

## Implemented files

```
lib/aurora/layout.ts
components/app-shell.tsx
components/app-sidebar.tsx
components/app-sidebar-brand.tsx
components/app-nav.tsx
components/mobile-header.tsx
components/mobile-nav-drawer.tsx
components/page-content.tsx
components/page-frame.tsx
components/panel.tsx
components/page-header.tsx
components/launch/prompt-template.tsx
components/launch/launch-room.tsx
components/launch/preview-room.tsx
components/launch/preview-tabs.tsx
components/launch/file-preview.tsx
app/layout.tsx                    # viewport export
app/globals.css                   # overflow-x-hidden
docs/design.md                    # mobile section
```

## Phase audit (2026-07-01)

- [x] **DRY** — `layout.ts` tokens; shared `AppSidebarBrand`, `LaunchActions`
- [x] **Conciseness** — Drawer reuses `AppNav`
- [x] **Patterns** — `ButtonLink`, voxel chrome preserved
- [x] **Browser** — Verified at 390px emulation

## Reference

Original audit and plan in git history; breakpoint `md` (768px).
