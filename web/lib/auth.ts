import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import LinkedIn from "next-auth/providers/linkedin"

if (process.env.NODE_ENV === "production") {
  const required = [
    "AUTH_SECRET",
    "AUTH_GOOGLE_ID",
    "AUTH_GOOGLE_SECRET",
    "AUTH_GITHUB_ID",
    "AUTH_GITHUB_SECRET",
    "AUTH_LINKEDIN_ID",
    "AUTH_LINKEDIN_SECRET",
  ]
  const missing = required.filter((k) => !process.env[k])
  if (missing.length > 0) {
    throw new Error(
      `[auth] missing required env vars in production: ${missing.join(", ")}. ` +
        `OAuth will not work. Set in Vercel or .env.local before deploying.`
    )
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [Google, GitHub, LinkedIn],
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const protectedPaths = ["/dashboard", "/mail"]
      const isProtected = protectedPaths.some((p) =>
        nextUrl.pathname.startsWith(p)
      )
      if (isProtected && !isLoggedIn) {
        return false
      }
      return true
    },
    jwt({ token, user, account }) {
      if (user?.id) token.id = user.id
      // Persist the GitHub access token for star checking
      if (account?.provider === "github" && account.access_token) {
        token.githubAccessToken = account.access_token
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      // Pass GitHub access token to session for star verification API
      if (token.githubAccessToken) {
        ;(session as any).accessToken = token.githubAccessToken
      }
      return session
    },
  },
})
