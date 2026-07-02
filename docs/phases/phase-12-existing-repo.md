# Phase 12 — Prepare existing repo (post-MVP)

**Status:** complete  
**Completed:** 2026-07-01  
**Depends on:** MVP complete (phases 01–11)  
**Estimated scope:** large

## Goal

Let users onboard an existing GitHub repository with Aurora setup files via a setup PR instead of creating a new repo.

## Acceptance criteria

- [x] User can select an existing repo
- [x] Aurora detects which setup files already exist
- [x] Setup PR contains only missing files
- [x] Workspace appears in dashboard after linking
- [x] Readiness score reflects actual repo state
- [x] Build passes

## Implemented

```
app/launch/prepare-existing/page.tsx
components/launch/prepare-existing-room.tsx
app/api/github/repositories/route.ts          # GET list installation repos
app/api/github/repositories/scan/route.ts   # POST scan setup files
app/api/workspaces/prepare-existing/route.ts # POST branch + PR + workspace
lib/aurora/setup-paths.ts
lib/github/list-repositories.ts
lib/github/scan-repository.ts
lib/github/branches.ts
lib/github/pull-requests.ts
lib/workspaces/prepare-existing-repository.ts
```

## Flow

1. Validate launch brief in Launch room.
2. Open **Prepare existing repo** (`/launch/prepare-existing`).
3. Select a repository from the GitHub App installation.
4. Aurora scans the default branch for Aurora setup files.
5. **Open setup pull request** commits only missing files to `aurora/setup-{timestamp}` and opens a PR.
6. Workspace row created with `created_from: existing_repo` and readiness from the scan.

## Reference

Spec sections 6, 31 (Phase 2).
