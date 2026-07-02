# Phase 07 — GitHub auth & App installation

**Status:** complete  
**Completed:** 2026-07-01  
**Depends on:** [phase-01](./phase-01-app-shell.md)  
**Estimated scope:** medium–large

## Goal

Allow users to sign in with GitHub and connect the Aurora GitHub App for repo operations.

## Acceptance criteria

- [x] User can sign in with GitHub
- [x] Session available in server components and route handlers
- [x] Unauthenticated users cannot call create-repo API
- [x] GitHub App install URL or connection step exists
- [x] Sign out works
- [x] App-wide auth when `AUTH_REQUIRED=true` (production default)
- [x] Build passes

## Implemented files

```
auth.ts
middleware.ts
lib/auth/require-auth.ts
types/next-auth.d.ts
app/api/auth/[...nextauth]/route.ts
app/api/github/installation/route.ts
app/api/repos/create/route.ts          # protected stub → phase 08
lib/github/env.ts
lib/github/app-auth.ts
lib/github/installation.ts
components/auth/session-provider.tsx
components/auth/auth-buttons.tsx
components/settings/github-connection.tsx
components/settings/github-install-button.tsx
components/settings/github-installation-linker.tsx
components/launch/create-repository-button.tsx
app/settings/page.tsx
.env.example
```

## Env vars

See `.env.example`. User-provided names supported:

- `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`
- `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_SLUG`
- `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET` (optional)

**GitHub App Setup URL:** `http://localhost:3000/settings` (captures `installation_id`)

**OAuth callback:** `http://localhost:3000/api/auth/callback/github`

## Phase audit (2026-07-01)

- [x] **DRY** — env helpers in `lib/github/env.ts`; auth buttons reused
- [x] **Patterns** — Auth.js v5 JWT session; `ButtonLink` for install URL
- [x] **Browser** — Settings flow; preview Create button reflects auth state
- [x] **Docs** — `.env.example` + this file

## Reference

Spec sections 7–8.
