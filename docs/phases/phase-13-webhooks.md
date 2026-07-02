# Phase 13 — GitHub webhooks (post-MVP)

**Status:** complete  
**Completed:** 2026-07-01  
**Depends on:** [phase-10](./phase-10-database.md)  
**Estimated scope:** medium

## Goal

Receive GitHub webhooks to keep the Aurora index fresh without polling — essential for the **overnight agent workflow**.

## Acceptance criteria

- [x] Webhook endpoint verifies GitHub signature
- [x] Duplicate deliveries are ignored (`webhook_deliveries`)
- [x] Issue open/close/update refreshes `task_index` (tracked + `aurora:` labels)
- [x] Pull request events create/update `pr_index` rows
- [x] `check_run` updates PR CI status on `pr_index`
- [x] `push` to default branch refreshes readiness flags
- [x] Manual refresh rebuilds workspace from GitHub
- [x] Repository webhooks registered when workspace is created
- [x] Build passes

## Implemented

```
db/schema.ts                         # webhook_deliveries, pr_index
app/api/github/webhook/route.ts
app/api/workspaces/[id]/refresh/route.ts
lib/github/webhook-signature.ts
lib/github/webhook-dedupe.ts
lib/github/webhook-dispatch.ts
lib/github/webhook-handlers/*
lib/github/webhooks-register.ts
lib/github/sync-workspace.ts
lib/github/workspace-index.ts
components/dashboard/refresh-workspace-button.tsx
```

## Setup

1. Add `GITHUB_WEBHOOK_SECRET` to `.env.local` (same secret used when registering hooks).
2. Run `npm run db:push` to apply `drizzle/0001_superb_rawhide_kid.sql`.
3. Ensure callback URL resolves: set `AURORA_WEBHOOK_URL` or deploy with `AUTH_URL` / Vercel URL.
4. Creating or refreshing a workspace registers a repo webhook pointing at `/api/github/webhook`.

For local testing, use a tunnel (e.g. `ngrok`) and set `AURORA_WEBHOOK_URL=https://….ngrok.io/api/github/webhook`.

## Reference

Spec sections 9, 10, 23, 31 (Phase 3); product vision in [README](./README.md).
