import { getChildKeys } from "@/app/server-actions/child-key/get-child-keys";
import { ChildKeyManagementClient } from "@/components/child-keys/child-key-management-client";
import { requireSession } from "@/lib/auth-server";

export async function ChildKeyManagementSection() {
  const session = await requireSession();
  const keys = await getChildKeys();

  return (
    <ChildKeyManagementClient
      keys={keys}
      defaultUserEmail={session.user.email}
    />
  );
}
