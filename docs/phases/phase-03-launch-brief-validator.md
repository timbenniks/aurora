# Phase 03 — Launch brief schema & validator

**Status:** complete  
**Completed:** 2026-07-01  
**Depends on:** [phase-01](./phase-01-app-shell.md)  
**Estimated scope:** medium

## Goal

Implement strict JSON validation for `aurora.launch_brief.v1` with hard errors and soft warnings.

## In scope

- TypeScript types for `LaunchBrief`
- Zod schema covering spec sections 11–13:
  - `project`, `product`, `technical`, `workflow`, `files`, `milestones`, `tasks`
  - Enum enforcement for visibility, project_type, task type/risk/priority, workflow preset
- Hard error rules (block creation):
  - Invalid JSON, wrong schema_version, missing required fields
  - Empty tasks, empty acceptance criteria, empty validation commands
  - Missing `agent_kickoff.prompt`
  - `workflow.agent_provider` must be `cursor`
  - Unsafe file paths / path traversal
  - Invalid `repo_name` characters
- Warning rules (allow but surface):
  - Auth none + protected route tasks
  - Database none + persistence tasks
  - No risk areas, no non-goals, large first task, etc.
- API route: `POST /api/launch-brief/validate`

## Out of scope

- File generation (phase 04)
- UI for validation results (phase 05)
- Repo creation

## Acceptance criteria

- [x] Valid example brief returns `{ valid: true, errors: [], warnings: [...] }`
- [x] Invalid brief returns structured errors with field paths
- [x] Malformed JSON returns clean error (no crash)
- [x] API returns parsed `summary` (project name, task count, file count)
- [x] Build passes

## Implemented files

```
lib/aurora/
  types.ts
  launch-brief-schema.ts
  validate-launch-brief.ts
  example-launch-brief.ts
app/api/launch-brief/validate/route.ts
```

## Phase audit (2026-07-01)

- [x] **DRY** — Schema, rules, and API separated; example brief in one fixture
- [x] **Conciseness** — `validateLaunchBrief` is the single entry point
- [x] **Clean code** — Typed messages with `code`, `message`, `path`
- [x] **Patterns** — Zod schema + post-parse business rules
- [x] **shadcn/ui** — N/A (API only)
- [x] **Neon queries** — N/A
- [x] **Caching** — N/A
- [x] **Browser** — N/A (API tested via curl)

## API contract

```json
// POST /api/launch-brief/validate
{ "json": { ... } }

// Response
{
  "valid": true,
  "errors": [],
  "warnings": [{ "code": "...", "message": "...", "path": "..." }],
  "summary": {
    "projectName": "...",
    "repoName": "...",
    "taskCount": 3,
    "fileCount": 12,
    "visibility": "private",
    "projectType": "web_app"
  }
}
```

## Reference

Spec sections 11–13, 23 (`POST /api/launch-brief/validate`).
