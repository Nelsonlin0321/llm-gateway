import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

import { organizationPluginRoles } from "@/lib/organization/permissions";

export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      roles: organizationPluginRoles,
    }),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  organization,
} = authClient;

