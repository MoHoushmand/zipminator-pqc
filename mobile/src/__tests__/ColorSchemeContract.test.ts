/**
 * Coverage gap G5: useColorScheme platform-divergent contract.
 *
 * `mobile/hooks/` ships TWO variants of the same hook:
 *
 *   - `use-color-scheme.ts`     (native: iOS, Android)
 *     `export { useColorScheme } from 'react-native'`
 *
 *   - `use-color-scheme.web.ts` (web)
 *     Wraps RN's hook with a hydration-safety bypass: returns 'light'
 *     until React has hydrated, then returns RN's value.
 *
 * The contract that must hold across both:
 *
 *   1. Both export a function named `useColorScheme`.
 *   2. Pre-hydration on web returns the deterministic 'light' (for SSR
 *      consistency). A regression that drops the hydration guard would
 *      cause flicker / hydration mismatch warnings on every page load.
 *   3. Post-hydration on web returns whatever RN's `useColorScheme`
 *      returns ('light' | 'dark' | null).
 *
 * Discovered: 2026-05-01 v22 audit, never tested in 21 prior passes.
 */

import { renderHook, act } from '@testing-library/react-native';

// ─── Native variant: trivial re-export contract ─────────────────────────

describe('use-color-scheme (native variant)', () => {
  test('exports a function named useColorScheme', () => {
    const mod = require('../../hooks/use-color-scheme');
    expect(typeof mod.useColorScheme).toBe('function');
  });

  test('native variant is the RN hook itself (no wrapper)', () => {
    // The native file is `export { useColorScheme } from 'react-native'`.
    // The exported reference must be identical to RN's own export.
    const native = require('../../hooks/use-color-scheme').useColorScheme;
    const rn = require('react-native').useColorScheme;
    expect(native).toBe(rn);
  });
});

// ─── Web variant: hydration-safe wrapper ────────────────────────────────

describe('use-color-scheme.web (web variant)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('exports a function named useColorScheme', () => {
    const mod = require('../../hooks/use-color-scheme.web');
    expect(typeof mod.useColorScheme).toBe('function');
  });

  test('returns "light" pre-hydration (SSR-safety)', () => {
    // Mock RN's useColorScheme to return 'dark' so we can verify the
    // wrapper actually shadows it before hydration.
    jest.doMock('react-native', () => ({
      useColorScheme: () => 'dark',
    }));
    const { useColorScheme } = require('../../hooks/use-color-scheme.web');

    const { result } = renderHook(() => useColorScheme());

    // Initial render is pre-hydration: must be 'light' regardless of RN.
    expect(result.current).toBe('light');
  });

  test('returns RN value post-hydration', () => {
    jest.doMock('react-native', () => ({
      useColorScheme: () => 'dark',
    }));
    const { useColorScheme } = require('../../hooks/use-color-scheme.web');

    const { result, rerender } = renderHook(() => useColorScheme());

    // useEffect fires after first commit; act() flushes it.
    act(() => {
      // re-render to see the post-hydration value
      rerender({});
    });

    expect(result.current).toBe('dark');
  });

  test('post-hydration null from RN passes through (no preference)', () => {
    jest.doMock('react-native', () => ({
      useColorScheme: () => null,
    }));
    const { useColorScheme } = require('../../hooks/use-color-scheme.web');

    const { result, rerender } = renderHook(() => useColorScheme());
    act(() => {
      rerender({});
    });

    // Web variant must NOT clamp null → 'light' post-hydration; that
    // would mask the user's "no preference" signal.
    expect(result.current).toBeNull();
  });
});

// ─── Cross-variant name-parity ───────────────────────────────────────────

describe('color-scheme platform parity', () => {
  test('both variants export useColorScheme by the same name', () => {
    const native = require('../../hooks/use-color-scheme');
    const web = require('../../hooks/use-color-scheme.web');
    expect(Object.keys(native)).toContain('useColorScheme');
    expect(Object.keys(web)).toContain('useColorScheme');
  });

  test('both variants export a function (not a value, not a class)', () => {
    const native = require('../../hooks/use-color-scheme').useColorScheme;
    const web = require('../../hooks/use-color-scheme.web').useColorScheme;
    expect(typeof native).toBe('function');
    expect(typeof web).toBe('function');
  });
});

// ─── TODO (user A/B): pre-hydration default ─────────────────────────────
//
// The web variant currently returns 'light' before hydration. Two options:
//
//   Shape A — KEEP 'light': matches the existing implementation. Stable
//             but ignores `prefers-color-scheme: dark` for the SSR frame,
//             causing a flash-of-light-mode on dark-mode users' devices.
//   Shape B — READ matchMedia: in the web wrapper, peek at
//             `window.matchMedia('(prefers-color-scheme: dark)').matches`
//             pre-hydration. Fixes the flash but breaks SSR determinism
//             (server can't read matchMedia).
//   Shape C — CSS-FIRST: drop the JS hydration guard entirely; use CSS
//             `@media (prefers-color-scheme: dark)` for theme variables
//             and treat the JS hook as a programmatic-only signal. Best
//             UX, but requires every consumer of the hook to migrate to
//             CSS variables.
//
// Mo: pick A/B/C. The current test pins Shape A; B and C require
// rewriting the test's assertions.
