# Phase 10 — Database & workspace index

**Status:** complete  
**Completed:** 2026-07-01  
**Depends on:** [phase-09](./phase-09-commit-and-bootstrap.md)  
**Estimated scope:** medium

## Goal

Persist Aurora workspace metadata in Neon Postgres. DB is a rebuildable index, not source of truth.

This phase unblocks the dashboard (phase 11) and later the overnight workflow: webhooks (13) → PR index (14) → merge inbox (14b).

## In scope

Drizzle schema for MVP tables (spec section 10):

- `users` — from GitHub sign-in
- `github_installations`
- `workspaces`
- `workspace_status` — readiness + file flags + task counts
- `task_index` — cached issue summaries

Enums / fields per spec:

- `created_from`: `launch_brief` | `existing_repo` | `imported`
- `workspace_status` readiness fields for file checklist

After successful create-from-brief:

- Upsert user from session (`githubUserId` in JWT — re-sign-in required once)
- Store installation reference
- Insert workspace row
- Insert workspace_status (readiness ~100 for fresh Aurora repos)
- Insert task_index rows from created issues

API routes:

- `GET /api/workspaces` — list user's workspaces only
- `GET /api/workspaces/:id` — detail from cache
- `POST /api/workspaces/:id/refresh` — stub: re-fetch from GitHub later (phase 13)
- `DELETE /api/workspaces/:id` — implemented in phase 11 (delete GitHub repo + index rows)

DB connection via `@neondatabase/serverless` + Drizzle.

Run migrations: `npx drizzle-kit generate` + `migrate` or `push`.

## Out of scope

- `pr_index`, `webhook_deliveries` tables (phases 13–14; design indexes now for inbox queries)
- Full GitHub sync engine
- Webhook-driven updates
- Dashboard UI (phase 11)

## Acceptance criteria

- [x] Schema defined and migration generated (`drizzle/0000_lean_masked_marvel.sql`)
- [x] Workspace row created after repo bootstrap (via `saveWorkspaceIndex`)
- [x] Status row reflects generated files (readiness from `calculateReadiness`)
- [x] Task index rows match created issues
- [x] `GET /api/workspaces` returns only Aurora workspaces for signed-in user
- [x] Build passes

**Deploy note:** run `npx drizzle-kit push` (or `migrate`) against Neon before testing persistence locally.

## Suggested files

```
db/schema.ts
db/index.ts                   # drizzle client
lib/aurora/
  workspaces.ts               # create/read helpers
  readiness.ts                # score calculation
lib/workspaces/
  save-workspace-index.ts     # persist after create
  bootstrap-snapshot.ts       # rebuild bootstrap from brief + partial
lib/auth/session-user.ts      # session → DB user fields
app/api/workspaces/route.ts
app/api/workspaces/[id]/route.ts
app/api/workspaces/[id]/refresh/route.ts
```

## Pre-phase audit (phases 01–09)

Audit against the [phase completion checklist](./README.md#phase-completion-checklist):

| Check | Result |
|-------|--------|
| DRY | Shared progress UI (`WorkspaceCreationProgress`), stepped create orchestration in `run-workspace-creation.ts`, GitHub helpers in `lib/github/*` |
| Conciseness | Pages thin; create/bootstrap logic in `lib/workspaces/*` |
| Clean code | Deprecated alias `createRepositoryFromBrief` kept for compatibility; no dead imports |
| Patterns | `ButtonLink` for nav CTAs; `requireGitHubSession` for GitHub routes |
| shadcn/ui | `Button`, `Panel` used consistently |
| Neon/Drizzle | N/A until this phase |
| Caching | `complete-storage` uses stable snapshot for `useSyncExternalStore` |
| Browser | Complete page infinite loop fixed via cached snapshot |

Minor follow-ups (non-blocking): extract duplicate `buildHandoff` if a third caller appears; `summarizeBrief` now uses `generateAllFiles` for accurate counts.

## Readiness score (spec section 19)

| Artifact | Points |
|----------|--------|
| `.aurora/project.json` | 10 |
| `SPEC.md` | 10 |
| `AGENTS.md` | 15 |
| `BUGBOT.md` | 10 |
| `APPROVAL_POLICY.md` | 10 |
| `.cursor/rules/project.mdc` | 10 |
| `.cursor/approval-policies/ROUTING.md` | 10 |
| Issue template | 10 |
| PR template | 10 |
| Validation workflow | 5 |

## Reference

Spec sections 9–10, 19, 23; suggested task 9.
