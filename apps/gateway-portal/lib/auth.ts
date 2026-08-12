import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/lib/db";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      // Google verifies emails; allow linking to existing email/password accounts
      // even when the local user has not completed email verification.
      trustedProviders: ["google"],
      requireLocalEmailVerified: false,
    },
  },
  // OAuth callback failures redirect here when no per-flow errorCallbackURL is set.
  onAPIError: {
    errorURL: "/sign-in",
  },
  trustedOrigins: ["http://localhost:3000"],
  experimental: { joins: true },
  plugins: [nextCookies()],
});
