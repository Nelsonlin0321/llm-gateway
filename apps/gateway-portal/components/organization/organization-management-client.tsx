"use client";

import { useMemo, useState } from "react";
import { Building2, MailPlus, Plus, Trash2, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { CreateOrganizationModal } from "@/components/organization/create-organization-modal";
import { InviteMemberModal } from "@/components/organization/invite-member-modal";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { organization } from "@/lib/auth-client";
import {
  assignableRolesFor,
  normalizeOrganizationRole,
  ORGANIZATION_ROLE_LABELS,
  roleHasPermission,
  type OrganizationRoleName,
} from "@/lib/organization/permissions";
import type { OrganizationWorkspaceState } from "@/lib/organization/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function roleBadgeVariant(role: string) {
  const normalized = normalizeOrganizationRole(role);
  if (normalized === "root") return "warning" as const;
  if (normalized === "admin") return "info" as const;
  return "neutral" as const;
}

export function OrganizationManagementClient({
  organizations,
  activeOrganization,
  activeOrganizationId,
  currentUserId,
  currentUserEmail,
  incomingInvitations,
}: OrganizationWorkspaceState) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [busyInvitationId, setBusyInvitationId] = useState<string | null>(null);
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [memberPendingRemove, setMemberPendingRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [orgPendingDelete, setOrgPendingDelete] = useState(false);

  const currentMember = activeOrganization?.members.find(
    (item) => item.userId === currentUserId,
  );
  const currentRole = currentMember?.role ?? "viewer";
  const assignableRoles = assignableRolesFor(currentRole);
  const canInvite = roleHasPermission(currentRole, { invitation: ["create"] });
  const canUpdateOrg = roleHasPermission(currentRole, { organization: ["update"] });
  const canDeleteOrg = roleHasPermission(currentRole, { organization: ["delete"] });
  const canUpdateMember = roleHasPermission(currentRole, { member: ["update"] });
  const canDeleteMember = roleHasPermission(currentRole, { member: ["delete"] });
  const canCancelInvite = roleHasPermission(currentRole, { invitation: ["cancel"] });

  const pendingInvitations = useMemo(
    () =>
      (activeOrganization?.invitations ?? []).filter(
        (item) => item.status === "pending",
      ),
    [activeOrganization?.invitations],
  );

  const refresh = () => {
    router.refresh();
  };

  const handleCreate = async (values: { name: string; slug: string }) => {
    setIsCreating(true);
    const { error } = await organization.create({
      name: values.name,
      slug: values.slug,
    });
    setIsCreating(false);

    if (error) {
      toast.error(error.message || "Unable to create organization.");
      return;
    }

    toast.success("Organization created.");
    setCreateOpen(false);
    refresh();
  };

  const handleInvite = async (values: {
    email: string;
    role: OrganizationRoleName;
  }) => {
    setIsInviting(true);
    const { error } = await organization.inviteMember({
      email: values.email,
      role: values.role,
      organizationId: activeOrganization?.id,
    });
    setIsInviting(false);

    if (error) {
      toast.error(error.message || "Unable to send invitation.");
      return;
    }

    toast.success(`Invitation sent to ${values.email}.`);
    setInviteOpen(false);
    refresh();
  };

  const handleSetActive = async (organizationId: string) => {
    const { error } = await organization.setActive({ organizationId });
    if (error) {
      toast.error(error.message || "Unable to switch organization.");
      return;
    }
    refresh();
  };

  const handleDeleteOrg = async () => {
    if (!activeOrganization) return;
    const { error } = await organization.delete({
      organizationId: activeOrganization.id,
    });
    if (error) {
      toast.error(error.message || "Unable to delete organization.");
      return;
    }
    toast.success("Organization deleted.");
    setOrgPendingDelete(false);
    refresh();
  };

  const handleUpdateMemberRole = async (
    memberId: string,
    role: OrganizationRoleName,
  ) => {
    setBusyMemberId(memberId);
    const { error } = await organization.updateMemberRole({
      memberId,
      role,
      organizationId: activeOrganization?.id,
    });
    setBusyMemberId(null);

    if (error) {
      toast.error(error.message || "Unable to update member role.");
      return;
    }

    toast.success("Member role updated.");
    refresh();
  };

  const handleRemoveMember = async () => {
    if (!memberPendingRemove || !activeOrganization) return;
    setBusyMemberId(memberPendingRemove.id);
    const { error } = await organization.removeMember({
      memberIdOrEmail: memberPendingRemove.id,
      organizationId: activeOrganization.id,
    });
    setBusyMemberId(null);

    if (error) {
      toast.error(error.message || "Unable to remove member.");
      return;
    }

    toast.success("Member removed.");
    setMemberPendingRemove(null);
    refresh();
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setBusyInvitationId(invitationId);
    const { error } = await organization.cancelInvitation({ invitationId });
    setBusyInvitationId(null);

    if (error) {
      toast.error(error.message || "Unable to cancel invitation.");
      return;
    }

    toast.success("Invitation cancelled.");
    refresh();
  };

  const handleIncomingInvitation = async (
    invitationId: string,
    action: "accept" | "reject",
  ) => {
    setBusyInvitationId(invitationId);
    const result =
      action === "accept"
        ? await organization.acceptInvitation({ invitationId })
        : await organization.rejectInvitation({ invitationId });
    setBusyInvitationId(null);

    if (result.error) {
      toast.error(result.error.message || "Unable to update invitation.");
      return;
    }

    toast.success(
      action === "accept" ? "Invitation accepted." : "Invitation declined.",
    );
    refresh();
  };

  return (
    <div className="space-y-6">
      {incomingInvitations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
            <CardDescription>
              Invitations sent to {currentUserEmail}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {incomingInvitations.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-surface-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {item.organizationName || "Organization"}
                  </p>
                  <p className="text-[12px] text-text-tertiary">
                    Role:{" "}
                    {ORGANIZATION_ROLE_LABELS[normalizeOrganizationRole(item.role ?? "viewer")]}
                    {" · "}Expires {formatDate(item.expiresAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busyInvitationId === item.id}
                    onClick={() => void handleIncomingInvitation(item.id, "reject")}
                  >
                    Decline
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={busyInvitationId === item.id}
                    onClick={() => void handleIncomingInvitation(item.id, "accept")}
                  >
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-3 md:grid-cols-3">
        <Card className="bg-surface-1 shadow-none">
          <CardHeader className="gap-1 pb-2">
            <CardDescription>Organizations</CardDescription>
            <CardTitle className="text-2xl">{organizations.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-surface-1 shadow-none">
          <CardHeader className="gap-1 pb-2">
            <CardDescription>Members</CardDescription>
            <CardTitle className="text-2xl">
              {activeOrganization?.members.length ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-surface-1 shadow-none">
          <CardHeader className="gap-1 pb-2">
            <CardDescription>Pending invites</CardDescription>
            <CardTitle className="text-2xl">{pendingInvitations.length}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Your organizations</CardTitle>
            <CardDescription>
              Switch the active organization used across the workspace.
            </CardDescription>
          </div>
          <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            New organization
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {organizations.map((item) => {
            const isActive = item.id === activeOrganizationId;
            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-lg border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Building2 className="size-4 text-text-tertiary" />
                    <p className="truncate text-sm font-medium text-text-primary">
                      {item.name}
                    </p>
                    <Badge variant={roleBadgeVariant(item.role)}>
                      {ORGANIZATION_ROLE_LABELS[normalizeOrganizationRole(item.role)]}
                    </Badge>
                    {isActive ? <Badge variant="success">Active</Badge> : null}
                  </div>
                  <p className="mt-1 font-mono text-[12px] text-text-tertiary">
                    {item.slug}
                  </p>
                </div>
                {!isActive ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleSetActive(item.id)}
                  >
                    Switch
                  </Button>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {activeOrganization ? (
        <>
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <CardTitle>Members</CardTitle>
                <CardDescription>
                  People who can access {activeOrganization.name}.
                </CardDescription>
              </div>
              {canInvite ? (
                <Button type="button" size="sm" onClick={() => setInviteOpen(true)}>
                  <MailPlus className="size-3.5" />
                  Invite member
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-2">
              {activeOrganization.members.map((item) => {
                const normalized = normalizeOrganizationRole(item.role);
                const isSelf = item.userId === currentUserId;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-lg border border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {item.user.name || item.user.email}
                        {isSelf ? " (you)" : ""}
                      </p>
                      <p className="truncate text-[12px] text-text-tertiary">
                        {item.user.email}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {canUpdateMember && assignableRoles.length > 0 ? (
                        <select
                          value={normalized}
                          disabled={busyMemberId === item.id}
                          onChange={(event) =>
                            void handleUpdateMemberRole(
                              item.id,
                              event.target.value as OrganizationRoleName,
                            )
                          }
                          className="h-8 rounded-md border border-border-visible bg-transparent px-2 text-[13px]"
                        >
                          {assignableRoles.map((role) => (
                            <option key={role} value={role}>
                              {ORGANIZATION_ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge variant={roleBadgeVariant(item.role)}>
                          {ORGANIZATION_ROLE_LABELS[normalized]}
                        </Badge>
                      )}
                      {canDeleteMember && !isSelf ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-error hover:bg-error-bg hover:text-error"
                          disabled={busyMemberId === item.id}
                          onClick={() =>
                            setMemberPendingRemove({
                              id: item.id,
                              name: item.user.name || item.user.email,
                            })
                          }
                        >
                          <UserMinus className="size-3.5" />
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invitations</CardTitle>
              <CardDescription>
                Pending invitations for {activeOrganization.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingInvitations.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  No pending invitations.
                </p>
              ) : (
                <div className="space-y-2">
                  {pendingInvitations.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-lg border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {item.email}
                        </p>
                        <p className="text-[12px] text-text-tertiary">
                          {ORGANIZATION_ROLE_LABELS[normalizeOrganizationRole(item.role ?? "viewer")]}
                          {" · "}Expires {formatDate(item.expiresAt)}
                        </p>
                      </div>
                      {canCancelInvite ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busyInvitationId === item.id}
                          onClick={() => void handleCancelInvitation(item.id)}
                        >
                          {busyInvitationId === item.id ? "Cancelling..." : "Cancel"}
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <OrganizationSettingsCard
            key={activeOrganization.id}
            name={activeOrganization.name}
            slug={activeOrganization.slug}
            organizationId={activeOrganization.id}
            canUpdate={canUpdateOrg}
            canDelete={canDeleteOrg}
            onUpdated={refresh}
            onDelete={() => setOrgPendingDelete(true)}
          />
        </>
      ) : null}

      <CreateOrganizationModal
        open={createOpen}
        isSubmitting={isCreating}
        onClose={() => {
          if (!isCreating) setCreateOpen(false);
        }}
        onSubmit={handleCreate}
      />

      <InviteMemberModal
        open={inviteOpen}
        isSubmitting={isInviting}
        assignableRoles={assignableRoles}
        onClose={() => {
          if (!isInviting) setInviteOpen(false);
        }}
        onSubmit={handleInvite}
      />

      <AlertDialog
        open={memberPendingRemove !== null}
        onOpenChange={(open) => {
          if (!open && busyMemberId === null) {
            setMemberPendingRemove(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {memberPendingRemove?.name ?? "member"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They will lose access to this organization immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyMemberId !== null}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={busyMemberId !== null}
              onClick={() => void handleRemoveMember()}
            >
              Remove member
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={orgPendingDelete}
        onOpenChange={(open) => {
          if (!open) setOrgPendingDelete(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {activeOrganization?.name ?? "this organization"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the organization, its members, and pending
              invitations. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleDeleteOrg()}
            >
              Delete organization
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function OrganizationSettingsCard({
  name,
  slug,
  organizationId,
  canUpdate,
  canDelete,
  onUpdated,
  onDelete,
}: {
  name: string;
  slug: string;
  organizationId: string;
  canUpdate: boolean;
  canDelete: boolean;
  onUpdated: () => void;
  onDelete: () => void;
}) {
  const [orgName, setOrgName] = useState(name);
  const [orgSlug, setOrgSlug] = useState(slug);
  const [isSavingOrg, setIsSavingOrg] = useState(false);

  const handleSaveOrg = async () => {
    setIsSavingOrg(true);
    const { error } = await organization.update({
      organizationId,
      data: {
        name: orgName.trim(),
        slug: orgSlug.trim(),
      },
    });
    setIsSavingOrg(false);

    if (error) {
      toast.error(error.message || "Unable to update organization.");
      return;
    }

    toast.success("Organization updated.");
    onUpdated();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization settings</CardTitle>
        <CardDescription>
          {canUpdate
            ? "Update the active organization name and slug."
            : "Viewers can see organization details but cannot edit them."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="settings-org-name"
              className="text-sm font-medium text-text-primary"
            >
              Name
            </label>
            <input
              id="settings-org-name"
              value={orgName}
              disabled={!canUpdate || isSavingOrg}
              onChange={(event) => setOrgName(event.target.value)}
              className="h-10 w-full rounded-md border border-border-visible bg-transparent px-3 text-sm disabled:opacity-60"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="settings-org-slug"
              className="text-sm font-medium text-text-primary"
            >
              Slug
            </label>
            <input
              id="settings-org-slug"
              value={orgSlug}
              disabled={!canUpdate || isSavingOrg}
              onChange={(event) => setOrgSlug(event.target.value)}
              className="h-10 w-full rounded-md border border-border-visible bg-transparent px-3 text-sm disabled:opacity-60"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {canUpdate ? (
            <Button
              type="button"
              onClick={() => void handleSaveOrg()}
              disabled={isSavingOrg}
            >
              {isSavingOrg ? "Saving..." : "Save changes"}
            </Button>
          ) : (
            <span />
          )}
          {canDelete ? (
            <Button
              type="button"
              variant="ghost"
              className="text-error hover:bg-error-bg hover:text-error"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
              Delete organization
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
