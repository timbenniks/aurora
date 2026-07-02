# Phase 14b — Merge inbox (post-MVP)

**Status:** complete  
**Depends on:** [phase-14](./phase-14-pr-observer.md)  
**Estimated scope:** medium

## Product goal

Support the overnight agent workflow:

1. Evening — create a launch brief and queue GitHub issues via Aurora.
2. Overnight — Cursor agents open PRs; CI, Bugbot, and Approval Agents run.
3. Morning — open Aurora and see a **merge inbox**: PRs ready to review and merge across all workspaces.

Aurora does not run agents or approve PRs. It surfaces what is ready for human action.

## Goal

Build a cross-workspace **merge inbox** — one screen aggregating `pr_index` rows filtered to actionable PRs.

## In scope

### Route: `/inbox` (or primary tab on Overview)

- List PRs across all user workspaces, sorted by readiness to merge
- Filters / sections (initial set):
  - **Ready to merge** — CI green, Bugbot clean (or policy-compliant), approval agent approved, human review not required
  - **Needs your review** — human review required or approval blocked
  - **In progress** — checks pending, draft PRs, agent still working
- Each row: repo, PR title, linked issue, CI/Bugbot/approval badges, GitHub link
- Empty state: “No PRs yet — create issues and let agents work overnight”

### API

- `GET /api/inbox` — aggregate `pr_index` joined with `workspaces` for the signed-in user
- Query indexes on `pr_index(workspace_id, state, approval_status, ci_status)` designed in phase 10/14

### Overview integration

- Hero metric: “N PRs ready to merge”
- Link to full inbox

## Out of scope

- Merging from inside Aurora (GitHub remains merge surface for MVP)
- Cursor run status API
- Notifications / email digest

## Acceptance criteria

- [x] Inbox shows PRs from all Aurora workspaces for the signed-in user
- [x] Ready-to-merge filter matches `pr_index` status fields from webhooks
- [x] Rows link to GitHub PR and source issue
- [x] Empty and loading states are clear
- [x] Build passes

## Reference

Product vision (overnight tasks → morning merge queue); spec sections 10 (`pr_index`), 18.
