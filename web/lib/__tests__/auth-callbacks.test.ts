/**
 * v26 G2: web/lib/auth.ts:19-47 NextAuth callbacks have 0 unit tests.
 *
 * Three callbacks decide security-critical behavior:
 *
 *   - authorized({ auth, request }): protects /dashboard and /mail.
 *     A bug in `protectedPaths.some(p => nextUrl.pathname.startsWith(p))`
 *     silently exposes those routes to unauthenticated users.
 *
 *   - jwt({ token, user, account }): persists user.id and the GitHub OAuth
 *     access token onto the JWT. If user.id is unset on first login, the
 *     /api/* routes that key on session.user.id break silently.
 *
 *   - session({ session, token }): rehydrates session.user.id and copies
 *     `token.githubAccessToken` onto `(session as any).accessToken`. The
 *     `as any` cast (line 44) bypasses the type system — a regression
 *     would not surface at compile time.
 *
 * These tests import the callbacks directly (not via the NextAuth handler)
 * so they run in vitest without spinning up a Next request.
 */

import { describe, it, expect, beforeAll } from "vitest"

// Pull the raw NextAuthConfig out of web/lib/auth.ts. We re-import the
// callbacks as plain functions and exercise them with synthetic args.
//
// IMPORTANT: web/lib/auth.ts currently exports { handlers, auth, signIn, signOut }
// from NextAuth(). The callbacks themselves are not exported — see the
// USER DECISION below. To make this skeleton runnable, the callbacks need
// to be split into a named export.

let authorizedCallback: any
let jwtCallback: any
let sessionCallback: any

beforeAll(async () => {
  // TODO once v26 G2 fix lands: import the callbacks from web/lib/auth.ts.
  // Until then, these tests are skipped via the `it.skip` markers below.
  try {
    const mod: any = await import("../auth")
    authorizedCallback = mod.callbacks?.authorized
    jwtCallback = mod.callbacks?.jwt
    sessionCallback = mod.callbacks?.session
  } catch {
    // Module shape doesn't yet expose callbacks separately.
  }
})

/**
 * USER DECISION (TODO before un-skipping):
 *
 *   A. EXPORT-CALLBACKS: Split web/lib/auth.ts callbacks into a named
 *      export (e.g. `export const authCallbacks = { authorized, jwt, session }`)
 *      so they're testable in isolation. NextAuth() then receives
 *      `callbacks: authCallbacks`. Lowest blast radius.
 *
 *   B. EXPORT-CONFIG: Export the full NextAuthConfig object as
 *      `authConfig`, then call `NextAuth(authConfig)`. Tests import
 *      `authConfig.callbacks`. Slightly more invasive.
 *
 *   C. INTEGRATION-ONLY: Skip unit tests, rely on web/e2e/oauth.spec.ts.
 *      But e2e can't easily exercise the `(session as any).accessToken`
 *      cast or the protectedPaths boundary cases.
 *
 * Recommended: A. Single one-line change to web/lib/auth.ts; tests below
 * activate immediately.
 */

describe("authorized callback (web/lib/auth.ts:19-29)", () => {
  it.skip("returns false for /dashboard when not logged in", () => {
    const result = authorizedCallback({
      auth: null,
      request: { nextUrl: { pathname: "/dashboard" } },
    })
    expect(result).toBe(false)
  })

  it.skip("returns false for /mail when not logged in", () => {
    const result = authorizedCallback({
      auth: null,
      request: { nextUrl: { pathname: "/mail" } },
    })
    expect(result).toBe(false)
  })

  it.skip("returns true for /dashboard when logged in", () => {
    const result = authorizedCallback({
      auth: { user: { id: "u1" } },
      request: { nextUrl: { pathname: "/dashboard" } },
    })
    expect(result).toBe(true)
  })

  it.skip("returns true for unprotected paths regardless of auth", () => {
    const result = authorizedCallback({
      auth: null,
      request: { nextUrl: { pathname: "/about" } },
    })
    expect(result).toBe(true)
  })

  it.skip("startsWith match must not allow /dashboardrogue bypass", () => {
    /* Pin the prefix-match semantic. /dashboard, /dashboard/, /dashboard/foo
       must all be protected. The current `startsWith("/dashboard")` also
       gates a hypothetical /dashboardpublic route — flag if intended. */
    const probes = [
      "/dashboard", "/dashboard/", "/dashboard/x", "/dashboardpublic",
    ]
    for (const path of probes) {
      const r = authorizedCallback({
        auth: null,
        request: { nextUrl: { pathname: path } },
      })
      expect(r, `Path ${path} should be protected when logged out`).toBe(false)
    }
  })

  it.skip("nested /mail subroutes are protected", () => {
    const result = authorizedCallback({
      auth: null,
      request: { nextUrl: { pathname: "/mail/compose" } },
    })
    expect(result).toBe(false)
  })
})

describe("jwt callback (web/lib/auth.ts:30-37)", () => {
  it.skip("persists user.id when present on the user object", () => {
    const token: any = {}
    const result = jwtCallback({ token, user: { id: "user-123" } })
    expect(result.id).toBe("user-123")
  })

  it.skip("does not overwrite existing token.id when user is undefined", () => {
    const token: any = { id: "existing-id" }
    const result = jwtCallback({ token, user: undefined })
    expect(result.id).toBe("existing-id")
  })

  it.skip("captures GitHub access_token only for github provider", () => {
    const token: any = {}
    const result = jwtCallback({
      token,
      user: { id: "u1" },
      account: { provider: "github", access_token: "gho_xxx" },
    })
    expect(result.githubAccessToken).toBe("gho_xxx")
  })

  it.skip("ignores access_token when provider is google", () => {
    const token: any = {}
    const result = jwtCallback({
      token,
      user: { id: "u1" },
      account: { provider: "google", access_token: "ya29.xxx" },
    })
    expect(result.githubAccessToken).toBeUndefined()
  })

  it.skip("does not crash when account is null (subsequent JWT refresh)", () => {
    const token: any = { id: "u1", githubAccessToken: "gho_xxx" }
    const result = jwtCallback({ token, user: undefined, account: null })
    /* Refresh path must preserve the previously-captured token. */
    expect(result.githubAccessToken).toBe("gho_xxx")
  })
})

describe("session callback (web/lib/auth.ts:38-47)", () => {
  it.skip("hydrates session.user.id from token.id", () => {
    const session: any = { user: { name: "Mo", email: "mo@qdaria.com" } }
    const result = sessionCallback({
      session,
      token: { id: "user-123" },
    })
    expect(result.user.id).toBe("user-123")
  })

  it.skip("copies token.githubAccessToken to session.accessToken", () => {
    /* Pin the `(session as any).accessToken` cast. Without this assertion,
       a regression that drops the cast or renames the property goes silent. */
    const session: any = { user: { id: "u1" } }
    const result: any = sessionCallback({
      session,
      token: { id: "u1", githubAccessToken: "gho_xxx" },
    })
    expect(result.accessToken).toBe("gho_xxx")
  })

  it.skip("does not set accessToken when token has no githubAccessToken", () => {
    const session: any = { user: { id: "u1" } }
    const result: any = sessionCallback({ session, token: { id: "u1" } })
    expect(result.accessToken).toBeUndefined()
  })

  it.skip("does not crash when session.user is undefined", () => {
    /* Defensive: NextAuth may invoke this callback before the user is set
       on the session (e.g. during error redirects). */
    const session: any = {}
    expect(() =>
      sessionCallback({ session, token: { id: "u1" } })
    ).not.toThrow()
  })
})
