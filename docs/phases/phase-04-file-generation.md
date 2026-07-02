# Phase 04 — File generation service

**Status:** complete  
**Completed:** 2026-07-01  
**Depends on:** [phase-03](./phase-03-launch-brief-validator.md)  
**Estimated scope:** medium–large

## Goal

Generate all Aurora setup files from a validated launch brief. Pure functions, no GitHub calls.

## In scope

Service at `lib/aurora/generate-files.ts` with functions:

| Function | Output path |
|----------|-------------|
| `generateProjectJson` | `.aurora/project.json` |
| `generateReadme` | `README.md` |
| `generateSpecMd` | `SPEC.md` |
| `generateAgentsMd` | `AGENTS.md` |
| `generateBugbotMd` | `BUGBOT.md` |
| `generateApprovalPolicyMd` | `APPROVAL_POLICY.md` |
| `generateCursorRules` | `.cursor/rules/project.mdc` |
| `generateRoutingPolicy` | `.cursor/approval-policies/ROUTING.md` |
| `generateIssueTemplate` | `.github/ISSUE_TEMPLATE/agent-task.md` |
| `generatePullRequestTemplate` | `.github/pull_request_template.md` |
| `generateValidationWorkflow` | `.github/workflows/agent-validation.yml` |

Plus:

- `generateAllFiles(brief)` → `GeneratedFile[]`
- `generateIssueBodies(brief)` → issue preview data per task
- `getDefaultLabels()` → label list from spec section 15
- Template variable substitution from brief fields
- Validation workflow adapts to `package_manager` (npm vs pnpm)

## Out of scope

- Committing to GitHub (phase 09)
- Preview UI (phase 06)

## Acceptance criteria

- [x] All MVP file paths from spec section 14 are generated
- [x] File content includes correct project/stack/task metadata
- [x] Issue bodies include hidden `aurora:task` metadata comment
- [x] Unsafe paths are rejected
- [x] `generateValidationWorkflow` uses brief's `validation_commands`
- [x] Build passes

## Implemented files

```
lib/aurora/
  generate-files.ts
  labels.ts
  issue-format.ts
app/api/launch-brief/preview/route.ts
```

## Phase audit (2026-07-01)

- [x] **DRY** — Shared list/checklist helpers; labels and issues split by concern
- [x] **Conciseness** — One generator per file path; `generateAllFiles` maps paths to functions
- [x] **Clean code** — Reuses `isSafeGeneratedFilePath` from validator
- [x] **Patterns** — Pure functions, no GitHub calls
- [x] **shadcn/ui** — N/A
- [x] **Neon queries** — N/A
- [x] **Caching** — N/A
- [x] **Browser** — Preview API tested via curl

## Preview API

```bash
POST /api/launch-brief/preview
{ "json": { ... } }   # optional; defaults to example brief
```

Returns `files`, `issues`, `labels`, `milestones` when valid.

## Reference

Spec sections 14–17, 24.
