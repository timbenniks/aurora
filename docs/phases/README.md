# Aurora implementation phases

Bite-sized work chunks derived from [spec.md](../spec.md) and [design.md](../design.md).

Each phase is self-contained: goal, scope, acceptance criteria, and suggested files. Complete phases in order — later phases depend on earlier ones.

## Product vision

**Overnight agent workflow:** queue GitHub issues in the evening → Cursor agents open PRs overnight → wake up to a **merge inbox** of PRs ready to review and merge.

Aurora structures repos and surfaces status; GitHub, Cursor, Bugbot, and Approval Agents do the work.

## Progress

| Phase | Status | Summary |
|-------|--------|---------|
| 01 | **complete** | Layout, nav, core routes |
| 02 | **complete** | Aurora dark theme, typography, sidebar |
| 03 | **complete** | Zod schema + validation API |
| 04 | **complete** | Generate repo files from brief |
| 05 | **complete** | Prompt copy, JSON paste, validate |
| 06 | **complete** | Preview files, issues, labels |
| 06b | **complete** | Mobile shell + responsive launch/preview |
| 07 | **complete** | GitHub OAuth + App installation |
| 08 | **complete** | Create repo from validated brief |
| 09 | **complete** | Commit files, labels, milestones, issues |
| 10 | **complete** | Drizzle schema + workspace index |
| 11 | **complete** | Workspace list + detail + Cursor handoff |
| 12 | **complete** | Existing repo setup PR |
| 13 | **complete** | GitHub webhooks + cache refresh |
| 14 | **complete** | PR observer + activity timeline |
| 14b | **complete** | Cross-workspace merge inbox |
| 15+ | not started | Further post-MVP |

## MVP phases (build in order)

| Phase | File | Summary | Depends on |
|-------|------|---------|------------|
| 01 | [phase-01-app-shell.md](./phase-01-app-shell.md) | Layout, nav, core routes | — |
| 02 | [phase-02-design-tokens.md](./phase-02-design-tokens.md) | Aurora dark theme, typography, sidebar | 01 |
| 03 | [phase-03-launch-brief-validator.md](./phase-03-launch-brief-validator.md) | Zod schema + validation API | 01 |
| 04 | [phase-04-file-generation.md](./phase-04-file-generation.md) | Generate repo files from brief | 03 |
| 05 | [phase-05-create-project-ui.md](./phase-05-create-project-ui.md) | Prompt copy, JSON paste, validate | 02, 03 |
| 06 | [phase-06-preview-ui.md](./phase-06-preview-ui.md) | Preview files, issues, labels | 04, 05 |
| 06b | [phase-06b-mobile.md](./phase-06b-mobile.md) | Mobile shell + responsive layouts | 06 |
| 07 | [phase-07-github-auth.md](./phase-07-github-auth.md) | GitHub OAuth + App installation | 01 |
| 08 | [phase-08-repo-creation.md](./phase-08-repo-creation.md) | Create repo from validated brief | 07 |
| 09 | [phase-09-commit-and-bootstrap.md](./phase-09-commit-and-bootstrap.md) | Commit files, labels, milestones, issues | 04, 08 |
| 10 | [phase-10-database.md](./phase-10-database.md) | Drizzle schema + workspace index | 09 |
| 11 | [phase-11-dashboard.md](./phase-11-dashboard.md) | Workspace list + detail + Cursor handoff | 02, 10 |

## Post-MVP (overnight → merge inbox)

| Phase | File | Summary |
|-------|------|---------|
| 12 | [phase-12-existing-repo.md](./phase-12-existing-repo.md) | Prepare existing repo via setup PR |
| 13 | [phase-13-webhooks.md](./phase-13-webhooks.md) | GitHub webhooks keep index fresh overnight |
| 14 | [phase-14-pr-observer.md](./phase-14-pr-observer.md) | `pr_index`, PR ↔ issue links, activity |
| 14b | [phase-14b-merge-inbox.md](./phase-14b-merge-inbox.md) | Cross-workspace merge inbox for morning review |

Phases 13 → 14 → 14b deliver the core loop: agents work while you sleep, Aurora shows what is ready to merge when you open the app.

## Validation (every phase)

```bash
npm run typecheck
npm run lint
npm run build
```

## Phase completion checklist

Before marking a phase complete, audit the code just built:

1. **DRY** — No duplicated markup, logic, or styles; extract shared components/helpers.
2. **Conciseness** — Pages stay thin; business logic lives in `lib/`.
3. **Clean code** — Clear names, no dead code, no unused imports.
4. **Patterns** — Use established project conventions; avoid one-off hacks.
5. **shadcn/ui** — Prefer primitives (`Button`, `Card`, etc.) over custom styled divs.
6. **Base UI** — Navigation CTAs use `ButtonLink` (`Link` + `buttonVariants`), not `Button` with `render={<Link />}`.
7. **Neon / Drizzle** — Queries are indexed, minimal, and avoid N+1; only select needed columns.
8. **Caching** — Server Components and `fetch` cache tags where reads are repeated; no over-fetching.
9. **Browser** — No console errors on pages touched in the phase.
10. **Docs** — Update the phase file status, acceptance checkboxes, and this README progress table.

## Principles

- Aurora never calls an LLM.
- GitHub is the source of truth; the DB is a rebuildable index.
- One primary CTA per screen (see design.md).
- Match existing stack: Next.js 16, Drizzle, Neon, shadcn/ui, Tailwind v4.
- **UI styling:** follow `docs/design.md` v1.1 and `lib/aurora/voxel.ts` — midnight palette, voxel chrome, `ButtonLink` for nav CTAs.
