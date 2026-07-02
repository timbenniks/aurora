# Phase 11 — Workspace dashboard

**Status:** complete  
**Completed:** 2026-07-01  
**Depends on:** [phase-02](./phase-02-design-tokens.md), [phase-10](./phase-10-database.md)  
**Estimated scope:** medium–large

## Goal

Build the Overview and Workspaces UI so users can see Aurora-enabled repos and post-creation handoff.

## Acceptance criteria

- [x] Overview shows only Aurora workspaces
- [x] Workspace detail shows readiness + file checklist
- [x] Tasks link to GitHub issues
- [x] Cursor setup checklist displayed after creation
- [x] User can delete a repository from workspace detail (typed confirmation)
- [x] Deleting a workspace removes the GitHub repo and Aurora index rows
- [x] One primary CTA per screen
- [x] Empty states are friendly, not generic
- [x] Build passes

## Implemented

```
app/page.tsx                              # Overview with workspace cards (max 4)
app/workspaces/page.tsx                   # Full workspace list
app/workspaces/[id]/page.tsx              # Workspace detail from DB
components/dashboard/
  workspace-card.tsx
  workspace-grid.tsx
  workspace-overview-section.tsx
  workspace-detail.tsx
  readiness-badge.tsx
  files-checklist.tsx
  activity-timeline.tsx
  empty-workspaces.tsx
  delete-workspace-dialog.tsx
  deleted-workspace-banner.tsx
lib/aurora/dashboard.ts
lib/aurora/format.ts
lib/aurora/readiness-checklist.ts
lib/github/repos.ts                       # deleteRepository
lib/aurora/workspaces.ts                  # deleteWorkspaceForUser
app/api/workspaces/[id]/route.ts          # GET + DELETE
components/launch/complete-room.tsx       # Redirects to /workspaces/[id] when indexed
```

## Reference

Spec sections 18, 20, 22; suggested task 10.

## MVP done when

All phase 01–11 acceptance criteria met + spec section 29 checklist.
