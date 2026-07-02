import type { NextAuthConfig } from "next-auth";

// Edge-safe config shared by middleware and the full auth.ts (Node runtime).
// Must not import bcryptjs or the Prisma client — neither runs on the Edge.
export default {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "PLAYER" | "COURT_OWNER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
