"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, KeyRound, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { z } from "zod";

import { createChildKey } from "@/app/server-actions/child-key/create-child-key";
import { deleteChildKey } from "@/app/server-actions/child-key/delete-child-key";
import { revealChildKey } from "@/app/server-actions/child-key/reveal-child-key";
import { rotateChildKey } from "@/app/server-actions/child-key/rotate-child-key";
import { toggleChildKey } from "@/app/server-actions/child-key/toggle-child-key";
import { ChildKeyFormModal } from "@/components/child-keys/child-key-form-modal";
import { ChildKeySecretDialog } from "@/components/child-keys/child-key-secret-dialog";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createChildKeyInputSchema,
  type ChildKeyListItem,
  type ChildKeyTags,
} from "@/lib/child-key/schema";
import { hasPermission, type Role } from "@/lib/organization/permissions";
import { cn } from "@/lib/utils";

type ChildKeyManagementClientProps = {
  organizationId: string;
  keys: ChildKeyListItem[];
  defaultUserEmail: string;
  role?: Role | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function tagEntries(tags: ChildKeyTags) {
  return (
    Object.entries(tags).filter(
      ([, value]) => typeof value === "string" && value.length > 0,
    ) as Array<[string, string]>
  );
}

export function ChildKeyManagementClient({
  organizationId,
  keys,
  defaultUserEmail,
  role = null,
}: ChildKeyManagementClientProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, startSubmitting] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [keyPendingDelete, setKeyPendingDelete] =
    useState<ChildKeyListItem | null>(null);
  const [keyPendingRotate, setKeyPendingRotate] =
    useState<ChildKeyListItem | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<{
    apiKey: string;
    name: string;
    mode: "created" | "rotated" | "reveal";
  } | null>(null);
  const canCreate = hasPermission(role, "childKey", "create");
  const canView = hasPermission(role, "childKey", "view");
  const canUpdate = hasPermission(role, "childKey", "update");
  const canDelete = hasPermission(role, "childKey", "delete");

  const stats = useMemo(() => {
    const active = keys.filter((key) => key.isActive).length;
    return {
      total: keys.length,
      active,
      inactive: keys.length - active,
    };
  }, [keys]);

  const handleCreate = async (
    values: z.infer<typeof createChildKeyInputSchema>,
  ) => {
    startSubmitting(async () => {
      const result = await createChildKey(values, organizationId);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);
      setFormOpen(false);

      if (result.apiKey) {
        setRevealedSecret({
          apiKey: result.apiKey,
          name: result.childKey.name,
          mode: "created",
        });
      }

      router.refresh();
    });
  };

  const handleReveal = async (key: ChildKeyListItem) => {
    setRevealingId(key.id);
    const result = await revealChildKey(key.id);
    setRevealingId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setRevealedSecret({
      apiKey: result.apiKey,
      name: result.name,
      mode: "reveal",
    });
  };

  const handleToggle = async (key: ChildKeyListItem) => {
    setTogglingId(key.id);
    const result = await toggleChildKey({
      id: key.id,
      isActive: !key.isActive,
    });
    setTogglingId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!keyPendingDelete) {
      return;
    }

    setDeletingId(keyPendingDelete.id);
    const result = await deleteChildKey(keyPendingDelete.id);
    setDeletingId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    setKeyPendingDelete(null);
    router.refresh();
  };

  const handleRotate = async () => {
    if (!keyPendingRotate) {
      return;
    }

    setRotatingId(keyPendingRotate.id);
    const result = await rotateChildKey(keyPendingRotate.id);
    setRotatingId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    setKeyPendingRotate(null);

    if (result.apiKey) {
      setRevealedSecret({
        apiKey: result.apiKey,
        name: result.childKey.name,
        mode: "rotated",
      });
    }

    router.refresh();
  };

  const openCreateModal = () => setFormOpen(true);

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Access"
          title="Child API keys"
          description="Issue scoped keys for teams, projects, and applications without exposing master provider credentials."
          actions={
            <>
              {canCreate ? (
                <Button type="button" size="sm" onClick={openCreateModal}>
                  <Plus className="size-3.5" />
                  Create key
                </Button>
              ) : null}
              <Link
                href={`/org/${organizationId}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                )}
              >
                <ArrowLeft className="size-3.5" />
                Overview
              </Link>
            </>
          }
        />

        <section className="grid grid-cols-3 gap-3">
          <MetricCard label="Total" value={stats.total.toString()} />
          <MetricCard label="Active" value={stats.active.toString()} />
          <MetricCard label="Inactive" value={stats.inactive.toString()} />
        </section>

        <Card className="border-border bg-card shadow-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">Issued keys</CardTitle>
          <CardDescription>
            Signed <span className="font-mono">sk_</span> JWTs with optional
            tags. Secrets are revealed on demand.
          </CardDescription>
          {canCreate ? (
            <CardAction>
              <Button type="button" size="sm" onClick={openCreateModal}>
                <Plus className="size-3.5" />
                Create key
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="p-0">
          {keys.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto flex size-9 items-center justify-center rounded-md border border-border bg-surface-2 text-text-secondary">
                <KeyRound className="size-4" />
              </div>
              <p className="mt-3 text-sm font-medium text-text-primary">
                No child keys yet
              </p>
              <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-5 text-text-secondary">
                Create a scoped key for a team, project, or application without
                sharing master provider credentials.
              </p>
              {canCreate ? (
                <Button
                  type="button"
                  size="sm"
                  className="mt-4"
                  onClick={openCreateModal}
                >
                  <Plus className="size-3.5" />
                  Create key
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {keys.map((key) => {
                const tags = tagEntries(key.tags);

                return (
                  <div
                    key={key.id}
                    className="flex flex-col gap-3 px-4 py-3.5 sm:px-5 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold tracking-[-0.01em] text-text-primary">
                          {key.name}
                        </p>
                        <Badge variant={key.isActive ? "success" : "warning"}>
                          {key.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge
                          variant="neutral"
                          className="font-mono text-[11px]"
                        >
                          {key.keyPreview}
                        </Badge>
                      </div>

                      <p className="text-[13px] text-text-secondary">
                        <span className="font-mono text-text-primary">
                          {key.userEmail}
                        </span>
                      </p>

                      {tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map(([tagKey, tagValue]) => (
                            <span
                              key={`${key.id}-${tagKey}`}
                              className="rounded-sm border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-text-secondary"
                            >
                              {tagKey}:{tagValue}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <p className="text-[11px] text-text-muted">
                        Created {formatDate(key.createdAt)}
                        {key.expiresAt
                          ? ` · Expires ${formatDate(key.expiresAt)}`
                          : " · No expiration"}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-1.5 self-start lg:self-center">
                      {canView ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={revealingId === key.id}
                          onClick={() => void handleReveal(key)}
                        >
                          <Eye className="size-3.5" />
                          {revealingId === key.id ? "Revealing..." : "Reveal"}
                        </Button>
                      ) : null}
                      {canUpdate ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={rotatingId === key.id}
                          onClick={() => setKeyPendingRotate(key)}
                        >
                          <RefreshCw className="size-3.5" />
                          {rotatingId === key.id ? "Rotating..." : "Rotate"}
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-error hover:bg-error-bg hover:text-error"
                          disabled={deletingId === key.id}
                          onClick={() => setKeyPendingDelete(key)}
                        >
                          <Trash2 className="size-3.5" />
                          {deletingId === key.id ? "Deleting..." : "Delete"}
                        </Button>
                      ) : null}
                      {canUpdate ? (
                        <label
                          className={cn(
                            "flex items-center gap-2 rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-[12px]",
                            togglingId === key.id && "opacity-60",
                          )}
                        >
                          <span className="text-text-secondary">
                            {key.isActive ? "On" : "Off"}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={key.isActive}
                            disabled={togglingId === key.id}
                            onClick={() => void handleToggle(key)}
                            className={cn(
                              "relative h-5 w-9 rounded-full transition-colors",
                              key.isActive ? "bg-accent" : "bg-surface-3",
                            )}
                          >
                            <span
                              className={cn(
                                "absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform",
                                key.isActive && "translate-x-4",
                              )}
                            />
                          </button>
                        </label>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      <ChildKeyFormModal
        open={formOpen}
        defaultUserEmail={defaultUserEmail}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setFormOpen(false);
          }
        }}
        onSubmit={handleCreate}
      />

      <ChildKeySecretDialog
        open={revealedSecret !== null}
        apiKey={revealedSecret?.apiKey ?? ""}
        keyName={revealedSecret?.name ?? ""}
        mode={revealedSecret?.mode ?? "created"}
        onClose={() => setRevealedSecret(null)}
      />

      <AlertDialog
        open={keyPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && deletingId === null) {
            setKeyPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {keyPendingDelete?.name ?? "child key"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the child key and its signed secret from
              this workspace. Any clients still using{" "}
              <span className="font-mono text-text-primary">
                {keyPendingDelete?.keyPreview ?? "this key"}
              </span>{" "}
              will fail authentication. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={keyPendingDelete === null || deletingId !== null}
            >
              {deletingId !== null ? "Deleting..." : "Delete child key"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={keyPendingRotate !== null}
        onOpenChange={(open) => {
          if (!open && rotatingId === null) {
            setKeyPendingRotate(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Rotate {keyPendingRotate?.name ?? "child key"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This issues a new secret for the same key identity. Name, tags,
              and expiration are kept. The current secret{" "}
              <span className="font-mono text-text-primary">
                {keyPendingRotate?.keyPreview ?? "this key"}
              </span>{" "}
              stops working immediately — update every client before or right
              after rotating.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rotatingId !== null}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              onClick={() => void handleRotate()}
              disabled={keyPendingRotate === null || rotatingId !== null}
            >
              {rotatingId !== null ? "Rotating..." : "Rotate key"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3.5 py-3 shadow-card">
      <p className="text-[11px] font-medium tracking-[0.08em] text-text-tertiary uppercase">
        {label}
      </p>
      <p className="mt-1 font-heading text-xl font-semibold tracking-[-0.03em] text-text-primary tabular-nums">
        {value}
      </p>
    </div>
  );
}
