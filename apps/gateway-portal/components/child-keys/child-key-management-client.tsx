"use client";

import { useMemo, useState, useTransition } from "react";
import { Eye, KeyRound, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { z } from "zod";

import { createChildKey } from "@/app/server-actions/child-key/create-child-key";
import { deleteChildKey } from "@/app/server-actions/child-key/delete-child-key";
import { revealChildKey } from "@/app/server-actions/child-key/reveal-child-key";
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
import { Button } from "@/components/ui/button";
import {
  Card,
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
import { cn } from "@/lib/utils";

type ChildKeyManagementClientProps = {
  keys: ChildKeyListItem[];
  defaultUserEmail: string;
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
  keys,
  defaultUserEmail,
}: ChildKeyManagementClientProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, startSubmitting] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [keyPendingDelete, setKeyPendingDelete] =
    useState<ChildKeyListItem | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<{
    apiKey: string;
    name: string;
    mode: "created" | "reveal";
  } | null>(null);

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
      const result = await createChildKey(values);

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

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Child keys"
          value={stats.total.toString()}
          detail="Issued in this workspace"
        />
        <MetricCard
          label="Active"
          value={stats.active.toString()}
          detail="Allowed to authenticate"
        />
        <MetricCard
          label="Inactive"
          value={stats.inactive.toString()}
          detail="Disabled keys"
        />
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <CardTitle className="text-[1.45rem]">Workspace child keys</CardTitle>
            <CardDescription className="leading-6">
              Issue downstream credentials with free-form tags (env, project,
              team, or anything you define). Tokens are signed JWTs prefixed with{" "}
              <span className="font-mono">sk_</span>.
            </CardDescription>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            Create child key
          </Button>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-strong bg-background px-5 py-10 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-md border border-border bg-surface-1 text-accent">
                <KeyRound className="size-4" />
              </div>
              <p className="mt-4 text-base font-medium text-text-primary">
                No child keys yet.
              </p>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-secondary">
                Create a child key to grant scoped gateway access for a team,
                project, or application without sharing master provider
                credentials.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-background">
              {keys.map((key, index) => {
                const tags = tagEntries(key.tags);

                return (
                  <div
                    key={key.id}
                    className={[
                      "flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between",
                      index > 0
                        ? "border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
                        : "",
                    ].join(" ")}
                  >
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-[1.05rem]">
                          {key.name}
                        </CardTitle>
                        <Badge
                          variant={key.isActive ? "success" : "warning"}
                        >
                          {key.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="neutral" className="font-mono text-[11px]">
                          {key.keyPreview}
                        </Badge>
                      </div>

                      <p className="text-sm text-text-secondary">
                        User{" "}
                        <span className="font-mono text-text-primary">
                          {key.userEmail}
                        </span>
                      </p>

                      {tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map(([tagKey, tagValue]) => (
                            <span
                              key={`${key.id}-${tagKey}`}
                              className="rounded-sm border border-border bg-surface-1 px-2 py-1 font-mono text-[11px] text-text-secondary"
                            >
                              {tagKey}:{tagValue}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-text-tertiary">No tags</p>
                      )}

                      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
                        Created {formatDate(key.createdAt)} · Updated{" "}
                        {formatDate(key.updatedAt)}
                        {key.expiresAt
                          ? ` · Expires ${formatDate(key.expiresAt)}`
                          : " · No expiration"}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 self-start lg:self-center">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={revealingId === key.id}
                        onClick={() => void handleReveal(key)}
                      >
                        <Eye className="size-3.5" />
                        {revealingId === key.id ? "Revealing..." : "Reveal key"}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={deletingId === key.id}
                        onClick={() => setKeyPendingDelete(key)}
                      >
                        <Trash2 className="size-3.5" />
                        {deletingId === key.id ? "Deleting..." : "Delete"}
                      </Button>
                      <label
                        className={cn(
                          "flex items-center gap-2 rounded-md border border-border bg-surface-1 px-3 py-2 text-sm",
                          togglingId === key.id && "opacity-60",
                        )}
                      >
                        <span className="text-text-secondary">
                          {key.isActive ? "Active" : "Inactive"}
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
    </>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="bg-surface-1 shadow-none">
      <CardHeader className="gap-1 pb-2">
        <CardDescription className="font-mono text-[11px] uppercase tracking-[0.08em]">
          {label}
        </CardDescription>
        <CardTitle className="font-mono text-[1.5rem]">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-5 text-text-secondary">{detail}</p>
      </CardContent>
    </Card>
  );
}
