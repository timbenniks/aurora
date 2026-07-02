# Phase 14 — PR observer & activity (post-MVP)

**Status:** complete  
**Depends on:** [phase-13](./phase-13-webhooks.md)  
**Estimated scope:** large

## Goal

Track agent PRs and show issue → PR workflow activity. Feeds the **merge inbox** (phase 14b).

## In scope

- `pr_index` table (spec section 10) with indexes for inbox queries:
  - `(workspace_id, state)`
  - `(approval_status, ci_status)` for ready-to-merge filters
- Webhook handlers for `pull_request`, `check_run`, `issue_comment`
- Infer Cursor activity from:
  - Branch names (`cursor/task-`)
  - PR template `aurora:pr` metadata
  - Labels (`aurora:in-progress`, etc.)
- Workspace detail additions:
  - Open / blocked / merged agent PR counts
  - Simple timeline: issue opened → PR opened → checks → review → merged
- Dashboard card metrics: open PRs, blocked PRs

## Out of scope

- Cross-workspace inbox UI (phase 14b)
- Cursor API run status (spec Phase 4)
- Learning / template suggestions (spec Phase 5)
- Billing, teams, Slack

## Acceptance criteria

- [x] PR index updates from webhooks
- [x] Workspace detail shows PR list linked to source issues
- [x] Activity timeline shows recent workflow events
- [x] Dashboard metrics match index

## Reference

Spec sections 10 (`pr_index`), 18, 31 (Phases 3–4); [phase-14b-merge-inbox.md](./phase-14b-merge-inbox.md).
