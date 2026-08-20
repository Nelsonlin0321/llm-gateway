import { getChildKeys } from "@/app/server-actions/child-key/get-child-keys";
import { ChildKeyManagementClient } from "@/components/child-keys/child-key-management-client";
import { requireSession } from "@/lib/auth-server";
import { getOrganizationRole } from "@/lib/organization/access";
import { resolveActiveOrganizationId } from "@/lib/organization/service";

export async function ChildKeyManagementSection() {
  const session = await requireSession();
  const role = await getOrganizationRole(
    session.user.id,
    await resolveActiveOrganizationId(session),
  );
  const keys = await getChildKeys();

  return (
    <ChildKeyManagementClient
      keys={keys}
      defaultUserEmail={session.user.email}
      role={role}
    />
  );
}
