import { getChildKeys } from "@/app/server-actions/child-key/get-child-keys";
import { ChildKeyManagementClient } from "@/components/child-keys/child-key-management-client";
import { requireSession } from "@/lib/auth-server";
import { getOrganizationRole } from "@/lib/organization/access";

type ChildKeyManagementSectionProps = {
  organizationId: string;
};

export async function ChildKeyManagementSection({
  organizationId,
}: ChildKeyManagementSectionProps) {
  const session = await requireSession();
  const role = await getOrganizationRole(session.user.id, organizationId);
  const keys = await getChildKeys(organizationId);

  return (
    <ChildKeyManagementClient
      organizationId={organizationId}
      keys={keys}
      defaultUserEmail={session.user.email}
      role={role}
    />
  );
}
