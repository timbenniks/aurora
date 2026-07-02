# Phase 01 — App shell

**Status:** complete  
**Completed:** 2026-07-01  
**Depends on:** —  
**Estimated scope:** small

## Goal

Create the base Next.js app structure with navigation and placeholder routes for the main Aurora screens.

## In scope

- App layout with left sidebar navigation
- Routes (can be placeholder content):
  - `/` — Overview / home
  - `/launch` — Launch room (create project)
  - `/workspaces` — Workspace list
  - `/workspaces/[id]` — Workspace detail (placeholder)
  - `/settings` — Settings (placeholder)
- Shared page shell (max-width container, padding)
- Basic nav active state

## Out of scope

- Aurora design tokens (phase 02)
- Real data or API routes
- Auth gates

## Acceptance criteria

- [x] Sidebar shows: Overview, Launch room, Workspaces, Settings
- [x] All routes render without error
- [x] Layout is reused across pages
- [x] `npm run typecheck`, `npm run lint`, `npm run build` pass

## Implemented files

```
app/
  layout.tsx
  page.tsx
  launch/page.tsx
  workspaces/page.tsx
  workspaces/[id]/page.tsx
  settings/page.tsx
components/
  app-nav.tsx
  app-sidebar.tsx
  app-shell.tsx
  empty-state.tsx
  page-content.tsx
  page-frame.tsx
  page-header.tsx
  panel.tsx
  ui/button-link.tsx
lib/
  navigation.ts
```

## Phase audit (2026-07-01)

- [x] **DRY** — Extracted `PageFrame`, `Panel`, `FeaturePanel`, `EmptyState`, `ButtonLink`
- [x] **Conciseness** — Pages are thin composition layers
- [x] **Clean code** — Nav active logic in `lib/navigation.ts`
- [x] **No weird patterns** — Navigation CTAs use `ButtonLink` (`Link` + `buttonVariants`)
- [x] **shadcn/ui primitives** — `Button`, `ButtonLink`; sidebar uses semantic tokens
- [x] **Neon queries** — N/A (no DB usage yet)
- [x] **Caching** — N/A (static placeholder pages)

## Notes

- Use shadcn sidebar or a simple custom sidebar for now.
- "Prepare existing repo" can appear disabled or "Coming soon" on home/launch.
- Templates nav item from design.md can wait until post-MVP.
