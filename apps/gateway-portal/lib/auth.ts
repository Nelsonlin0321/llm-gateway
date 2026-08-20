import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { db } from "@/lib/db";
import { sendInvitationEmail, sendVerificationEmail } from "@/lib/email";
import {
  defaultRole,
  ORGANIZATION_CREATOR_ROLE,
  ORGANIZATION_ROLE_LABELS,
  organizationPluginRoles,
  Role,
  roles,
  normalizeRole,
} from "./organization/permissions";

function invitationUrl(invitationId: string) {
  const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/accept-invitation?id=${encodeURIComponent(invitationId)}`;
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    // Block sign-in until email is verified; also skips auto sign-in on sign-up.
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    // Matches the 15-minute copy in the verification email template.
    expiresIn: 60 * 15,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        email: user.email,
        verificationUrl: url,
      });
    },
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
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const { createDefaultOrganizationForUser } =
            await import("@/lib/organization/service");
          try {
            await createDefaultOrganizationForUser(user);
          } catch (error) {
            console.error("Failed to create default organization", error);
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          if (session.activeOrganizationId) {
            return;
          }

          const { listOrganizationsForUser } =
            await import("@/lib/organization/service");
          const organizations = await listOrganizationsForUser(session.userId);
          const firstOrganization = organizations[0];
          if (!firstOrganization) {
            return;
          }

          return {
            data: {
              ...session,
              activeOrganizationId: firstOrganization.id,
            },
          };
        },
      },
    },
  },
  // OAuth callback failures redirect here when no per-flow errorCallbackURL is set.
  onAPIError: {
    errorURL: "/sign-in",
  },
  trustedOrigins: ["http://localhost:3000"],
  experimental: { joins: true },
  plugins: [
    nextCookies(),
    organization({
      creatorRole: ORGANIZATION_CREATOR_ROLE,
      roles: organizationPluginRoles,
      allowUserToCreateOrganization: true,
      invitationExpiresIn: 60 * 60 * 24 * 7,
      cancelPendingInvitationsOnReInvite: true,
      sendInvitationEmail: async ({
        email,
        organization: invitedOrganization,
        inviter,
        invitation,
      }) => {
        await sendInvitationEmail({
          email,
          inviterName: inviter.user.name || inviter.user.email,
          organizationName: invitedOrganization.name,
          roleLabel:
            ORGANIZATION_ROLE_LABELS[
              roles.includes(invitation.role as Role)
                ? (invitation.role as Role)
                : normalizeRole(invitation.role ?? defaultRole)
            ],
          invitationUrl: invitationUrl(invitation.id),
        });
      },
    }),
  ],
});
