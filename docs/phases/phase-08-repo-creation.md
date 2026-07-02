# Phase 08 — GitHub repo creation

**Status:** complete  
**Completed:** 2026-07-01  
**Depends on:** [phase-07](./phase-07-github-auth.md)  
**Estimated scope:** medium

## Goal

Create a new GitHub repository from a validated launch brief.

## Acceptance criteria

- [x] Authenticated user can create a repo with correct name and visibility
- [x] Default branch returned from brief (`workflow.default_branch`; branch is set when files land in phase 09)
- [x] Duplicate name shows clear error, no partial state
- [x] Success returns GitHub repo URL
- [x] Brief is re-validated on server before any GitHub call
- [x] Build passes

## Implemented files

```
lib/github/client.ts
lib/github/repos.ts
lib/github/errors.ts
lib/auth/github-session.ts
lib/workspaces/create-repository-from-brief.ts
app/api/workspaces/create-from-brief/route.ts
components/launch/create-repository-button.tsx   # wired to new API
app/api/repos/create/route.ts                    # deprecated → 410
```

## API

```http
POST /api/workspaces/create-from-brief
Content-Type: application/json

{ "launch_brief": { ... } }
```

```json
{
  "repo": {
    "id": 123,
    "owner": "user",
    "name": "tinyinvoices",
    "fullName": "user/tinyinvoices",
    "url": "https://github.com/user/tinyinvoices",
    "defaultBranch": "main"
  }
}
```

Error codes: `duplicate_repo_name` (409), `rate_limited` (429), `insufficient_permissions` (403), `invalid_brief` (400).

## GitHub auth for repo creation

Personal GitHub accounts cannot create repos with an **installation token** alone.
Aurora uses:

- **OAuth sign-in token** (`repo` scope) → `POST /user/repos` for personal accounts
- **App installation token** → `POST /orgs/{org}/repos` for organization accounts

After pulling this change, **sign out and sign in again** so the session picks up the `repo` scope.

The OAuth App (`AUTH_GITHUB_ID`) must allow the `repo` scope. The GitHub App still needs **Repository administration: Read and write** for org installs and later file commits.

## Phase audit (2026-07-01)

- [x] **DRY** — `requireGitHubSession`, shared `githubApiRequest`, brief logic in `lib/workspaces/`
- [x] **Patterns** — fetch + App installation token (matches phase 07)
- [x] **Browser** — Preview button posts brief, shows GitHub link on success
- [x] **Docs** — this file + README progress

## Reference

Spec sections 8, 23, 25; suggested task 6.
