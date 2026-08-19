import { getOrganizationWorkspace } from "@/app/server-actions/organization/get-organization-workspace";
import { OrganizationManagementClient } from "@/components/organization/organization-management-client";

export async function OrganizationManagementSection() {
  const workspace = await getOrganizationWorkspace();
  return <OrganizationManagementClient {...workspace} />;
}
