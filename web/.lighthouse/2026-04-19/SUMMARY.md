# Lighthouse Audit — 2026-04-19

- **Run-ID:** 20260419-180958-840e32 (Team U)
- **Branch:** marathon/u/20260419-180958-840e32 (base: feature/test-green)
- **Worktree:** `.marathon/worktrees/20260419-180958-840e32/ui-lighthouse`
- **Server:** Next.js 15.5.15 production build, port 3199
- **Lighthouse:** 13.1.0 (npx), Chrome stable
- **Audits:** single pass (no post-fix re-audit)

## Scores

| Route | Device | Perf | A11y | BP | SEO |
|---|---|---|---|---|---|
| `/` | mobile | 0.50 | 1.00 | 0.96 | 1.00 |
| `/` | desktop | 0.69 | 1.00 | 0.96 | 1.00 |
| `/invest/blueprint` | mobile | 0.80 | 0.96 | 0.96 | 1.00 |
| `/invest/blueprint` | desktop | 0.98 | 0.96 | 0.96 | 1.00 |

Threshold: 0.95 on every category. Failing cells: `/` perf (both), `/invest/blueprint` mobile perf.

## Core Web Vitals

| Route | Device | LCP | TBT | FCP | CLS | SI |
|---|---|---|---|---|---|---|
| `/` | mobile | 5.4 s | 5,240 ms | 1.2 s | 0 | 2.7 s |
| `/` | desktop | 1.2 s | 970 ms | 0.3 s | 0.002 | 0.7 s |
| `/invest/blueprint` | mobile | 5.4 s | 20 ms | 1.2 s | 0 | 1.3 s |
| `/invest/blueprint` | desktop | 1.0 s | 0 ms | 0.3 s | 0 | 0.3 s |

TBT 5.24 s on `/` mobile is the dominant perf deficit. Cause: heavy client-side JS in the 17 landing-page components (Three.js, framer-motion, react-three-fiber).

## Route Discrepancy

Task referenced `/blueprint`. Live route is `/invest/blueprint`:

- `curl -sI http://localhost:3199/blueprint` → HTTP 404
- `curl -sI http://localhost:3199/invest/blueprint` → HTTP 200

Audited `/invest/blueprint` and flagged here.

## Applied Fixes (scope-bounded)

- `web/app/layout.tsx`: added `<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous">` and `<link rel="dns-prefetch" href="https://fonts.googleapis.com">` in `<head>`.

That is the only in-scope mutation with a plausible perf signal. Not re-audited (single-pass mandate).

## Why perf < 0.95 is not fixed here

Budget scope allowed edits only on:

- `web/app/layout.tsx`
- `web/app/page.tsx`
- `web/app/blueprint/page.tsx` (does not exist)
- `web/public/robots.txt`
- `web/public/manifest.webmanifest`
- contrast tweaks in `web/app/globals.css`

Forbidden: any `web/components/**`, `web/lib/**`, `web/pillars.json`, `web/app/api/**`, `web/lib/auth.ts`.

The perf deficit is 100% client-side JS in the forbidden `web/components/**` tree. Remedies require component-level work (lazy-load heavy sections below the fold, suspend Three.js scenes, split framer-motion into dynamic chunks, or move hero visuals to static SVG + CSS). All out of scope.

A11y, Best-Practices, SEO all pass the 0.95 gate on both routes and devices.

## Artifacts

- `blueprint-desktop.json`
- `blueprint-mobile.json`
- `root-desktop.json`
- `root-mobile.json`
