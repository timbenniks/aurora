# Phase 06 — Preview UI

**Status:** complete  
**Completed:** 2026-07-01  
**Depends on:** [phase-04](./phase-04-file-generation.md), [phase-05](./phase-05-create-project-ui.md)  
**Estimated scope:** medium

## Goal

Let users preview generated files, issues, labels, and milestones before creating a repo.

## In scope

Route: `/launch/preview`

Tabs:

- **Files** — list + content preview for selected file
- **Issues** — task titles, milestones, labels, expandable body preview
- **Labels** — list from `getDefaultLabels`
- **Milestones** — from brief

Actions:

- Back to edit JSON
- **Create repository** (primary CTA) — disabled until auth in phase 07

Preview loads the saved draft from `localStorage`, validates, and calls `POST /api/launch-brief/preview`.

## Out of scope

- Actual GitHub repo creation (phase 08)
- Auth gate (phase 07)

## Acceptance criteria

- [x] File list matches generated output from phase 04
- [x] Selecting a file shows its content in a code block / preview panel
- [x] Issue preview shows `[agent] {title}` format
- [x] Labels and milestones match spec defaults
- [x] User can go back and edit JSON
- [x] Build passes

## Implemented files

```
app/launch/preview/page.tsx
components/launch/
  preview-room.tsx
  preview-tabs.tsx
  file-preview.tsx
  issue-preview.tsx
  labels-preview.tsx
  milestones-preview.tsx
lib/launch/fetch-launch-preview.ts
app/api/launch-brief/preview/route.ts   # existing
```

## Phase audit (2026-07-01)

- [x] **DRY** — Preview fetch in `lib/launch/`; tab panels are focused components
- [x] **Conciseness** — `PreviewRoom` orchestrates load + states; generation stays server-side
- [x] **Clean code** — Empty, error, invalid, and success states handled
- [x] **Patterns** — `ButtonLink` for back/edit; voxel tab buttons
- [x] **shadcn/ui** — `Button`, `ButtonLink`, `Panel`
- [x] **Neon queries** — N/A
- [x] **Caching** — N/A (client fetch on mount)
- [x] **Browser** — Build passes; preview reads `localStorage` draft
- [x] **Docs** — Phase file + README updated

## Design notes

- Cards over tables; file list left, content right (stacked on mobile)
- Primary CTA: "Create repository" (disabled until phase 07)

## Reference

Spec section 22 (preview screen), MVP flow steps 9–10.
