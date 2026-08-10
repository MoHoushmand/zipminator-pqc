# Zipminator Web — Design Specification
## QDaria Design System (01-stack.md compliant)

**Last Updated:** 2026-05-30
**Authority:** `.claude/rules/01-stack.md`
**Framework:** Next.js 16 + Tailwind v4 (CSS-first) + shadcn/ui CLI v4

---

## 1. Color Palette (OKLCH — mandatory)

All colors use OKLCH. No hex or HSL in the theme.

### Quantum Tokens (CSS variables in `globals.css :root`)

```css
/* Primary brand palette */
--quantum-cyan:    oklch(0.82 0.15 200);   /* #22D3EE — primary quantum accent */
--quantum-amber:   oklch(0.77 0.18 85);    /* #F59E0B — warning / highlight */
--quantum-rose:    oklch(0.72 0.19 10);    /* #FB7185 — danger / alert */
--quantum-emerald: oklch(0.79 0.17 155);   /* #34D399 — success / secure */
--quantum-violet:  oklch(0.72 0.17 290);   /* #A78BFA — code / secondary accent */
--bg-primary:      oklch(0.10 0.02 250);   /* #020817 — deep space background */
```

### Tailwind `quantum-*` Scale

The `quantum` scale in `tailwind.config.js` maps to OKLCH chroma ramp around the cyan hue (200):

| Token | OKLCH value |
|-------|-------------|
| `quantum-50` | `oklch(0.97 0.03 200)` |
| `quantum-300` | `oklch(0.87 0.11 200)` |
| `quantum-400` | `oklch(0.84 0.13 200)` |
| `quantum-500` | `var(--quantum-cyan)` |
| `quantum-700` | `oklch(0.62 0.15 200)` |
| `quantum-900` | `oklch(0.36 0.10 200)` |
| `quantum-950` | `oklch(0.22 0.07 200)` |

### Prohibited Colors

- **NEVER** use `purple-*` Tailwind classes for gradients or brand elements
- **NEVER** use hex colors in theme definitions (`#8b5cf6`, `#6366f1`, etc.)
- **NEVER** use HSL in CSS custom properties
- Purple-branded gradients (`from-purple-*`) are banned; use `quantum-*` or `violet-*` for incidental UI only

---

## 2. Typography

### Font Families (loaded via `next/font/google` in `layout.tsx`)

| Role | Font | CSS variable | Tailwind class |
|------|------|-------------|----------------|
| Display / Headings | **Fraunces** (serif, optical-size) | `--font-display` | `font-display` |
| Body | **DM Sans** | `--font-body` | `font-sans` / `font-body` |
| Code / Mono | **JetBrains Mono** | `--font-mono` | `font-mono` |

### Prohibited Fonts

- **NEVER** use Inter, Roboto, Arial, Outfit, Geist as named fonts in theme
- System-ui fallback is acceptable after the primary font stack

### Type Scale

```css
/* Hero / Display */
text-6xl md:text-7xl lg:text-8xl font-bold font-display

/* Section headlines */
text-4xl md:text-5xl font-bold font-display

/* Subsection titles */
text-2xl md:text-3xl font-semibold font-display

/* Body text */
text-lg md:text-xl leading-relaxed font-sans

/* Code / mono */
font-mono text-sm
```

### Line Heights & Tracking

```css
headings:    leading-[1.05] tracking-tight
subheadings: leading-snug   tracking-tight
body:        leading-relaxed
labels:      tracking-wide uppercase text-xs
```

---

## 3. Layout Patterns

### Container System

```tsx
// Canonical container — use .container-custom utility
className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"

// Section vertical rhythm
className="py-24 md:py-32"

// Compact section
className="py-12 md:py-16 lg:py-20"
```

### Grid Systems

```tsx
// 3-column feature grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"

// 2-column content layout
className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"

// 4-column grid
className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
```

---

## 4. UI Components

### Button System (from `globals.css`)

```tsx
// Primary — quantum gradient
className="btn-primary"
// -> bg-gradient-to-r from-quantum-500 to-quantum-700

// Secondary — glass outline
className="btn-secondary"
// -> border border-white/20 bg-white/5 backdrop-blur-sm

// Never recreate gradient inline using purple-* colors
```

### Card

```tsx
// Quantum card — glass morphism
className="card-quantum"
// -> bg-white/[0.04] backdrop-blur-xl border border-white/10
//   hover:border-quantum-500/40
```

### Focus States

```css
:focus-visible {
  ring-2 ring-quantum-500 ring-offset-2 ring-offset-gray-950
}
```

---

## 5. Visual Effects

### Gradients (quantum-compliant)

```css
/* Background gradients — use quantum tokens */
from-quantum-500/20 via-quantum-700/20 to-quantum-900/20

/* Text gradient */
.gradient-text {
  @apply text-transparent bg-clip-text bg-gradient-to-r from-quantum-400 via-quantum-300 to-cyan-400;
}

/* Never use: from-purple-* in brand gradients */
```

### Glow Effects

```css
/* OKLCH-based glow */
hover:shadow-[0_0_20px_oklch(0.82_0.15_200_/_0.3)]
hover:shadow-quantum-500/30

/* Grid background */
background-image: linear-gradient(oklch(0.82 0.15 200 / 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, oklch(0.82 0.15 200 / 0.1) 1px, transparent 1px);
```

### Animations

```css
/* Float */
animation: float 6s ease-in-out infinite;

/* Pulse slow */
animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;

/* Quantum background shift */
animation: quantum-bg-shift 12s ease-in-out infinite;
```

---

## 6. Dark / Light Mode

Dark mode is the default (`class="dark"` on `<html>`).

```css
/* Dark mode custom variant (Tailwind v4) */
@custom-variant dark (&:is(.dark *));
```

Light mode overrides are in `globals.css` under `html:not(.dark)`.

---

## 7. Accessibility

- Color contrast: minimum 4.5:1 for body text; 3:1 for large text
- Focus: visible `:focus-visible` ring (quantum-500)
- Motion: respect `prefers-reduced-motion`
- Semantic HTML: correct heading hierarchy (h1 to h6)
- ARIA labels on all interactive elements without visible text labels

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Implementation Checklist

### Phase 1: Foundation
- [x] Tailwind v4 with CSS-first theme in globals.css
- [x] OKLCH quantum color tokens defined in `:root`
- [x] Typography: Fraunces (display), DM Sans (body), JetBrains Mono (code)
- [x] Dark mode default
- [x] No Inter, no purple-* brand gradients

### Phase 2: Core Components
- [x] btn-primary / btn-secondary in globals.css
- [x] card-quantum utility
- [x] gradient-text utility (quantum-400 to cyan-400)
- [x] Navigation and Footer

### Phase 3 onwards: Feature Sections
See `docs/guides/implementation_plan.md` for roadmap phases.

---

## 9. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (Turbopack, React Compiler) |
| Styling | Tailwind v4 (CSS-first) + `tw-animate-css` |
| Components | shadcn/ui CLI v4 |
| Animation | Framer Motion |
| Icons | Lucide React |
| Type safety | TypeScript strict + Zod at API boundaries |
| Testing | Playwright (E2E), Vitest (unit) |

---

## 10. Performance Targets

- First Contentful Paint: < 1.5 s
- Largest Contentful Paint: < 2.5 s
- Cumulative Layout Shift: < 0.1
- Lighthouse Score: 90+ (all categories)

---

**Document Version:** 2.0
**Last Updated:** 2026-05-30
**Authority:** `.claude/rules/01-stack.md` (overrides this document on conflict)
**Status:** Compliant with QDaria Design System
