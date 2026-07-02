# Phase 09 — Commit files, labels, milestones & issues

**Status:** complete  
**Completed:** 2026-07-01  
**Depends on:** [phase-04](./phase-04-file-generation.md), [phase-08](./phase-08-repo-creation.md)  
**Estimated scope:** large

## Goal

After repo creation, bootstrap the repository with Aurora-generated content and GitHub project structure.

## Acceptance criteria

- [x] All MVP files committed to default branch (single Git commit via Git Data API)
- [x] `.aurora/project.json` included in commit set
- [x] All spec labels created (skips duplicates)
- [x] Milestones created and tasks assigned by title/id
- [x] One issue per task with correct body format
- [x] Partial bootstrap failures surfaced as warnings
- [x] `/launch/complete` shows repo summary + Cursor checklist
- [x] Build passes

## Implemented files

```
lib/github/token.ts
lib/github/commits.ts
lib/github/labels.ts
lib/github/milestones.ts
lib/github/issues.ts
lib/workspaces/bootstrap-repository.ts
lib/workspaces/create-repository-from-brief.ts   # createWorkspaceFromBrief
lib/launch/complete-storage.ts
app/launch/complete/page.tsx
components/launch/complete-room.tsx
components/launch/cursor-checklist.tsx
components/launch/create-repository-button.tsx   # redirects on success
```

## API response (`POST /api/workspaces/create-from-brief`)

Extends phase 08 with `bootstrap` and `handoff`:

```json
{
  "repo": { "fullName": "user/repo", "url": "...", "defaultBranch": "main" },
  "bootstrap": {
    "filesCommitted": 12,
    "filePaths": ["README.md", "..."],
    "labelsCreated": 18,
    "milestonesCreated": 1,
    "issues": [{ "number": 1, "title": "[agent] ...", "url": "..." }],
    "warnings": []
  },
  "handoff": {
    "agentCommand": "/agent build",
    "firstIssue": { "number": 1, "title": "...", "url": "..." }
  }
}
```

## Auth tokens

- **Personal accounts:** user OAuth token (`repo` scope) for bootstrap on the new repo
- **Organizations:** App installation token

## Phase audit (2026-07-01)

- [x] **DRY** — reuses phase 04 generators; shared `resolveRepoToken`
- [x] **Patterns** — single atomic commit; bootstrap warnings array
- [x] **Browser** — create → `/launch/complete` via sessionStorage
- [x] **Docs** — this file + README progress

## Reference

Spec sections 14–17, 20, 25; suggested tasks 7–8.
