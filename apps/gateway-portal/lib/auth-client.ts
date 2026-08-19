import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

import {
  ac,
  organizationRoles,
} from "@/lib/organization/permissions";

export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      ac,
      roles: organizationRoles,
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

