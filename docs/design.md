# Aurora Design System

Version: 1.1 (as implemented)

> **Source of truth for code:** `app/globals.css`, `lib/aurora/classes.ts`, `lib/aurora/voxel.ts`  
> If this doc and the code disagree, follow the code and update this doc.

---

# Design philosophy

Aurora is not another GitHub dashboard.

It should feel like opening a magical workshop where software comes to life.

The inspiration is a blend of:

- Minecraft voxel art
- Cursor
- Linear
- GitHub
- VS Code
- the Northern Lights

The interface should feel calm, premium, and playful.

Never childish.

Think "Minecraft for senior engineers."

---

# Core design principles

## 1. Content first

The original concept is visually beautiful, but too busy.

Artwork should support the interface, never compete with it.

Every page should answer:

"What do I need to do next?"

within 2 seconds.

---

## 2. One primary action

Every screen has exactly one dominant CTA.

Examples:

- Create project
- Validate brief
- Create repository
- Refresh workspace

Never present five equally important buttons.

---

## 3. Let GitHub do the heavy lifting

Aurora owns onboarding.

GitHub owns work.

Cursor builds.

Don't duplicate GitHub.

Summarize it.

---

## 4. Voxel UI chrome + pixel accents

The shell uses **voxel / pixel styling throughout** — chunky borders, hard shadows, sharp corners, pixel fonts.

Voxel **illustrations** (portal, workspace icons, empty-state art) are accents for heroes, empty states, and loading — not behind dense text or tables.

Avoid voxel backgrounds behind tables or long-form text.

---

## 5. Mobile-first shell

Breakpoint: **`md` (768px)** — below is phone, at/above is desktop sidebar.

| Mobile (`< md`) | Desktop (`≥ md`) |
|-----------------|------------------|
| Sticky header + hamburger | Fixed `w-64` sidebar |
| Off-canvas nav drawer | Inline sidebar nav |
| `p-4` page padding | `p-6` / `p-8` |
| Full-width primary CTAs | Inline button groups |
| Sticky footers on Launch / Preview | Header actions only |

Layout tokens live in `lib/aurora/layout.ts`. New screens must use them and be verified at **390px** width.

### Auth gating

Controlled by `AUTH_REQUIRED` in `.env.local` / Vercel:

| Value | Behavior |
|-------|----------|
| `false` | Local dev — all routes open (debugging, Cursor browser) |
| `true` | GitHub sign-in required on every page and API |
| unset on Vercel production | Treated as `true` |

Public without GitHub session: `/login`, `/api/auth/*`, `/api/github/webhook` (HMAC). See `lib/auth/public-paths.ts`.

Unsigned users redirect to `/login`. APIs return `401` JSON.

---

# Visual style

## Theme

**Dark only.** No light mode toggle for MVP.

Everything should feel like **midnight** under the Aurora Borealis — deep blue-black, not flat grey.

---

## Backgrounds (midnight palette)

| Token | Hex | Use |
|-------|-----|-----|
| Primary | `#020408` | Page background, midnight sky |
| Secondary | `#060a14` | Sidebar |
| Panels | `#0c1220` | Cards, panels |
| Elevated | `#121a2c` | Buttons (outline), hover surfaces |
| Input | `#080e18` | Form fields |

Borders: `#243049` (visible pixel edges) or `rgba(255,255,255,0.06)` for subtle dividers.

Optional: subtle starfield + pixel grid on the main canvas (`voxel-midnight-sky` in `globals.css`).

**Deprecated:** the lighter palette (`#07111D`, `#0D1726`, etc.) from v1.0 — do not revert to it.

---

## Aurora gradient

Main gradient

```
#4EF4C8
↓
#31C9FF
↓
#7D6BFF
↓
#C44DFF
```

Used only for:

- **Aurora** wordmark (gradient text in sidebar — not an image logo)
- active nav item background
- primary CTAs
- focus rings
- important highlights

Never as page backgrounds.

**Do not use** `public/aurora.png` in the UI — text wordmark only.

---

# Accent colors

Success

#38D987

Warning

#F3B343

Danger

#F05D5E

Information

#4FA8FF

---

# Typography

## Pixel heading font

**Press Start 2P** (`--font-pixel-heading`)

Used for:

- page titles (H1–H3)
- sidebar nav labels
- buttons
- section titles in pixel style

Always **uppercase** for nav and buttons (`uppercase tracking-wide`).

## Pixel body font

**VT323** (`--font-pixel`) at **18px** (`text-lg`) for body copy.

Crisp rendering: antialiasing off on `html`.

**Deprecated:** Geist / Inter for UI body — not used in the current shell.

---

# Font sizes

H1

42px

H2

30px

H3

22px

Section titles

18px

Body

15px

Small text

13px

Captions

12px

---

# Border radius

**0px everywhere** — sharp voxel corners (`rounded-none`).

No soft rounded cards or pills in the current shell.

---

# Shadows

**Chunky block shadows** for voxel depth — not soft blur-only elevation.

```
4px 4px 0 0 #010204
```

Panels also use `0 6px 24px rgba(0,0,0,.28)` for ambient depth.

Primary buttons add aurora glow: `0 0 20px rgba(79,244,200,0.22)`.

Hover: translate −1px / −2px and deepen shadow (100–150ms). Never bounce.

---

# Layout

Maximum width

1600px

Content padding

32px

Card spacing

24px

Grid

12 columns

---

# Navigation

Left sidebar. Simple.

**Branding**

- Word: **Aurora** (gradient text)
- Tagline: **Tim's token furnace**

**Items** (uppercase pixel labels)

- Overview
- Launch room
- Workspaces
- Settings

Templates: post-MVP.

**Active state** must match inactive typography (same font, size, uppercase, weight). Only the background changes — aurora gradient fill + dark text/icons.

Inactive: elevated midnight surface + voxel border.

Nothing else: no org switcher, billing, plan badges, or social links.

---

# Dashboard layout

Hero

Large welcome banner.

Contains:

- Create project
- Paste launch brief JSON

Small voxel portal artwork.

Nothing else.

---

Below hero

Workspace cards.

Maximum four across.

Each card contains:

Repository

Type

Readiness

Open tasks

Open PRs

Last activity

One status indicator

Nothing more.

---

Recent activity

Simple timeline.

Issue opened

PR merged

Review requested

Repository created

No graphs.

---

# Workspace cards

Top

Voxel icon.

Middle

Repository name

Small GitHub path

Bottom

Metrics

Tasks

PRs

Last update

Readiness ring

No progress bars.

The original mockup had too many competing visual elements.

---

# Icons

Lucide icons with square caps/joins (`voxelIconClass`).

Stroke width 2.5. Inherit text color (dark on active nav gradient, light on inactive).

---

# Buttons

Use shadcn `Button` + `ButtonLink` (`Link` + `buttonVariants`).  
**Never** `Button` with `render={<Link />}` — Base UI requires `ButtonLink`.

**Primary**

- Aurora gradient background
- Dark text `#020408`
- Voxel border + block shadow
- Press Start 2P, uppercase, ~10px

**Secondary / outline**

- `#121a2c` surface
- `#243049` border
- Light foreground text
- Same typography as primary

**Ghost**

- Text only, pixel heading font

Navigation CTAs: prefer `ButtonLink`.

---

# Inputs

Large (`h-10`), pixel body font (`text-xl` / VT323).

Dark `#080e18` background, `#243049` border, voxel block shadow.

Bright cyan focus ring (`#4ef4c8`).

---

# Tables

Avoid.

Prefer cards.

Engineers scan cards faster.

---

# Motion

Everything should feel alive.

Hover

Lift 2px

150ms

Buttons

Glow slightly

Cards

Tiny elevation

Never bounce.

Never overshoot.

---

# Artwork

Voxel illustrations should exist for:

Portal

Workspace

Package

CLI

Website

API

Electron

Documentation

AI agent

GitHub

Cursor

Issue

Pull request

Review

Validation

Build

Package

Settings

Empty state

Use a consistent isometric voxel perspective.

---

# Workspace icons

Each project type gets its own voxel object.

Web app

Small castle

API

Crystal tower

CLI

Workbench

Electron

Portal

Package

Floating cube

Docs

Library

Mobile

Beacon

This makes every workspace instantly recognizable.

---

# Readiness

Replace numbers with a glowing crystal.

100%

Bright cyan crystal

75%

Blue crystal

50%

Amber crystal

25%

Red crystal

This is much more memorable than another progress bar.

---

# Empty states

Prefer short pixel copy — no generic stock illustrations.

Voxel portal / world artwork is optional for empty states (not implemented yet in shell).

Example: "No workspaces yet" in a dashed voxel panel.

---

# Accessibility

Minimum contrast ratio AA.

Keyboard navigable.

Focus states always visible.

Never rely on color alone.

---

# Overall feeling

If Linear is a minimalist engineering notebook,

Aurora should feel like a beautifully crafted engineering adventure.

Professional enough for senior engineers.

Distinct enough that nobody mistakes it for another SaaS dashboard.

The interface should make people smile the first time they open it, then disappear while they work.
