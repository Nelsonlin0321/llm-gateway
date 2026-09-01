import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { and, eq } from "drizzle-orm";
import { db, member } from "@/lib/db";
import { sendInvitationEmail, sendVerificationEmail } from "@/lib/email";
import {
  assignableRolesFor,
  defaultRole,
  ORGANIZATION_CREATOR_ROLE,
  ORGANIZATION_ROLE_LABELS,
  organizationPluginRoles,
  Role,
  roles,
  normalizeRole,
} from "./organization/permissions";


function resolveTrustedOrigins(): string[] {
  const fromEnv = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  const origins = [...fromEnv];
  const base = process.env.BETTER_AUTH_URL?.trim();
  if (base) {
    try {
      origins.push(new URL(base).origin);
    } catch {
      // Ignore malformed BETTER_AUTH_URL; Better Auth will still validate it.
    }
  }
  if (origins.length === 0) {
    origins.push("http://localhost:3000");
  }
  return [...new Set(origins)];
}

function googleSocialProvider() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return undefined;
  }
  return {
    google: {
      clientId,
      clientSecret,
    },
  };
}

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
  socialProviders: googleSocialProvider() ?? {},
  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      // Google verifies emails; allow linking to existing email/password accounts
      // even when the local user has not completed email verification.
      trustedProviders: ["google"],
      requireLocalEmailVerified: false,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  rateLimit: {
    enabled: true,
    window: 10,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/forget-password": { window: 60, max: 3 },
    },
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
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
  trustedOrigins: resolveTrustedOrigins(),
  experimental: { joins: true },
  plugins: [
    nextCookies(),
    organization({
      creatorRole: ORGANIZATION_CREATOR_ROLE,
      roles: organizationPluginRoles,
      allowUserToCreateOrganization: true,
      invitationExpiresIn: 60 * 60 * 24 * 7,
      cancelPendingInvitationsOnReInvite: true,
      organizationHooks: {
        beforeCreateInvitation: async ({ invitation, inviter, organization: invitedOrg }) => {
          const [membership] = await db
            .select({ role: member.role })
            .from(member)
            .where(
              and(
                eq(member.userId, inviter.id),
                eq(member.organizationId, invitedOrg.id),
              ),
            )
            .limit(1);
          const allowed = assignableRolesFor(membership?.role);
          const invitedRoles = String(invitation.role ?? defaultRole)
            .split(",")
            .map((role) => normalizeRole(role.trim()))
            .filter(Boolean);
          if (
            invitedRoles.length === 0 ||
            invitedRoles.some((role) => !allowed.includes(role))
          ) {
            throw new APIError("FORBIDDEN", {
              message: "You cannot assign this role.",
            });
          }
        },
      },
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
