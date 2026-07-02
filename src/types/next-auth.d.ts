import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "PLAYER" | "COURT_OWNER";
    } & DefaultSession["user"];
  }

  interface User {
    role: "PLAYER" | "COURT_OWNER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "PLAYER" | "COURT_OWNER";
  }
}
