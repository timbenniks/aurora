# Phase 02 — Design tokens & theme

**Status:** complete  
**Completed:** 2026-07-01  
**Depends on:** [phase-01](./phase-01-app-shell.md)  
**Estimated scope:** small–medium

## Goal

Apply the Aurora design system so the app feels dark, premium, and on-brand before building feature UI.

## In scope

- Dark-only theme (no light mode toggle needed for MVP)
- CSS variables for midnight backgrounds per [design.md](../design.md) v1.1
  - Aurora gradient: `#4EF4C8` → `#31C9FF` → `#7D6BFF` → `#C44DFF`
  - Semantic: success, warning, danger, info
- Border radius: 0 (sharp voxel corners)
- Typography: Press Start 2P (headings/nav/buttons) + VT323 (body)
- Primary button variant with aurora gradient + soft glow
- Card component styled for workspace/dashboard use
- Subtle hover lift on cards (150ms)

## Out of scope

- Voxel artwork assets (use Lucide placeholders)
- Readiness crystal component (phase 11)
- Full component library

## Acceptance criteria

- [x] App defaults to dark Aurora palette
- [x] Primary CTA uses aurora gradient
- [x] Cards, inputs, and sidebar match design tokens
- [x] Focus rings are visible (accessibility)
- [x] Build passes

## Implemented files

```
app/globals.css                 # Aurora tokens + utility classes
components/ui/button.tsx        # Aurora gradient primary variant
components/ui/input.tsx         # Large dark inputs
components/ui/card.tsx          # shadcn card (installed)
components/panel.tsx            # aurora-surface + hover lift
components/app-nav.tsx          # Active nav uses aurora gradient
components/app-sidebar.tsx      # Gradient logo text
components/page-header.tsx      # 42px page titles
components/theme-provider.tsx   # Dark-only, no theme hotkey
```

## Phase audit (2026-07-01)

- [x] **DRY** — Shared `aurora-surface`, `aurora-gradient-bg`, `aurora-gradient-text` utilities in CSS
- [x] **Conciseness** — Panel reuses surface utilities; no duplicate hex values in components
- [x] **Clean code** — Removed unused theme hotkey; semantic tokens only
- [x] **No weird patterns** — ButtonLink inherits aurora default via `buttonVariants`
- [x] **shadcn/ui** — Card + Input installed; Button/Panel styled via tokens
- [x] **Neon queries** — N/A
- [x] **Caching** — N/A
- [x] **Browser** — Verified after build

## Design reference

See [design.md](../design.md) sections: Visual style, Typography, Buttons, Motion.
