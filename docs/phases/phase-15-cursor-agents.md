# Phase 15 — Cursor Cloud Agents API

**Status:** complete  
**Completed:** 2026-07-02  
**Depends on:** [phase-11](./phase-11-dashboard.md), [phase-13](./phase-13-webhooks.md)  
**Estimated scope:** medium

## Goal

Connect Aurora to the Cursor Cloud Agents API so workspace creation can automatically launch the first agent, and workspace detail shows live run status.

## Acceptance criteria

- [x] User can save/remove a Cursor API key in Settings (validated via `GET /v1/me`)
- [x] API key stored encrypted at rest (AES-256-GCM, keyed from `AUTH_SECRET`)
- [x] Auto-launch toggle launches first agent after workspace bootstrap when enabled
- [x] `POST /v1/agents` uses first task `agent_prompt`, repo URL, default branch, `autoCreatePR: true`
- [x] `task_index` stores `cursor_agent_id`, `cursor_run_id`, `cursor_run_status`, `cursor_agent_url`
- [x] Workspace detail shows agent run status + link to Cursor agent
- [x] Manual "Launch Cursor agent" button when not yet launched
- [x] Refresh endpoint updates Cursor run status for in-flight runs
- [x] Build passes

## Implemented

```
db/schema.ts                              # cursor_credentials, task_index cursor fields
lib/cursor/
  env.ts client.ts errors.ts types.ts
  crypto.ts credentials.ts agents.ts
  prompt.ts launch-agent.ts format.ts
app/api/cursor/api-key/route.ts
app/api/workspaces/[id]/launch-agent/route.ts
app/api/workspaces/create-from-brief/route.ts  # auto-launch hook
app/api/workspaces/[id]/refresh/route.ts      # cursor status refresh
components/settings/cursor-connection.tsx
components/settings/cursor-api-key-form.tsx
components/dashboard/cursor-agent-panel.tsx
components/dashboard/launch-agent-button.tsx
components/dashboard/new-workspace-banner.tsx
app/settings/page.tsx
app/workspaces/[id]/page.tsx
```

## Setup

1. Create a Cursor API key in [Cursor Dashboard → Integrations](https://cursor.com/dashboard?tab=integrations).
2. Open Aurora **Settings** → paste key → enable auto-launch if desired.
3. Create a workspace from a launch brief — Aurora launches the first Cloud Agent when connected.
4. Open the workspace detail page to see run status or launch manually.

Optional: set `CURSOR_API_BASE_URL` if using a non-default API host.

## Reference

Spec section 31 (Phase 4: Cursor API integration); [Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints).
