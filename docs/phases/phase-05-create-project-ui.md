# Phase 05 — Create project UI (validate step)

**Status:** complete  
**Completed:** 2026-07-01  
**Depends on:** [phase-02](./phase-02-design-tokens.md), [phase-03](./phase-03-launch-brief-validator.md)  
**Estimated scope:** medium

## Goal

Build the Launch room flow for steps 1–3: copy external LLM prompt, paste JSON, validate.

## In scope

Route: `/launch` (multi-step or single page with sections)

1. **Copy prompt** — show copyable external LLM template (spec section 21)
2. **Paste JSON** — large textarea for launch brief
3. **Validate** — call `POST /api/launch-brief/validate`
4. **Results** — show valid/invalid, errors, warnings, parsed summary

Actions:

- Copy prompt button
- Validate button (primary CTA)
- Edit JSON / try again
- Continue to preview (enabled only when valid) → `/launch/preview` stub until phase 06

Store validated brief in `sessionStorage` for the preview step.

## Out of scope

- File/issue preview (phase 06)
- Repo creation
- Auth requirement (can add in phase 07)

## Acceptance criteria

- [x] User can copy the LLM prompt template
- [x] User can paste and validate JSON
- [x] Errors and warnings render clearly (danger vs warning styling)
- [x] Summary shows project name, task count, visibility, project type
- [x] Invalid brief blocks "Continue"
- [x] One primary CTA per step (design principle)
- [x] Build passes

## Implemented files

```
app/launch/page.tsx
app/launch/preview/page.tsx       # stub until phase 06
components/launch/
  launch-room.tsx
  prompt-template.tsx
  brief-editor.tsx
  validation-results.tsx
components/ui/textarea.tsx
lib/aurora/external-prompt.ts
lib/launch/brief-storage.ts
```

## Phase audit (2026-07-01)

- [x] **DRY** — Prompt text in one module; textarea styles shared; storage helper extracted
- [x] **Conciseness** — `LaunchRoom` orchestrates; subcomponents stay focused
- [x] **Clean code** — Client JSON parse before API; disabled states for empty input
- [x] **Patterns** — `ButtonLink` for continue; voxel `Textarea` matches `Input`
- [x] **shadcn/ui** — `Button`, `ButtonLink`, `Panel` / `FeaturePanel`
- [x] **Neon queries** — N/A
- [x] **Caching** — N/A
- [x] **Browser** — `/launch` flow verified; fixed nav hydration mismatch in `app-nav.tsx`

## Design reference

See [design.md](../design.md) v1.1 — voxel inputs, one primary CTA, aurora gradient validate button.

## Reference

Spec sections 21–22 (create project + validation screens), MVP flow steps 4–8.
