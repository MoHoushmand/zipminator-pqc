import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import LinkedIn from "next-auth/providers/linkedin"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    GitHub({
      authorization: { params: { scope: "read:user user:email" } },
    }),
    Google({
      authorization: { params: { scope: "openid email profile" } },
    }),
    LinkedIn({
      authorization: { params: { scope: "openid profile email" } },
    }),
  ],
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
    signIn() {
      return true
    },
    jwt({ token, user, account }) {
      if (user?.id) token.id = user.id
      if (account?.access_token) {
        token.accessToken = account.access_token
      }
      if (account?.provider) {
        token.provider = account.provider
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      if (token.accessToken) {
        session.accessToken = token.accessToken as string
      }
      if (token.provider) {
        session.provider = token.provider as string
      }
      return session
    },
  },
})
