"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Boxes, PencilLine, Plus, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { createProvider } from "@/app/server-actions/llm-provider/create-provider";
import { deleteProvider } from "@/app/server-actions/llm-provider/delete-provider";
import { updateProvider } from "@/app/server-actions/llm-provider/update-provider";
import { ProviderFormModal } from "@/components/llm-providers/provider-form-modal";
import { ProviderListFilters } from "@/components/llm-providers/provider-list-filters";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createProviderInputSchema,
  hasProviderListFilters,
  type ProviderListItem,
  type ProviderListQuery,
  updateProviderInputSchema,
} from "@/lib/llm-provider/schema";
import { hasPermission, type Role } from "@/lib/organization/permissions";
import { cn } from "@/lib/utils";

type ProviderManagementClientProps = {
  providers: ProviderListItem[];
  query?: ProviderListQuery;
  role?: Role | null;
};

type ModalState =
  { mode: "create" } | { mode: "edit"; provider: ProviderListItem } | null;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ProviderManagementClient({
  providers,
  query = {},
  role = null,
}: ProviderManagementClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const organizationId = pathname.match(/^\/org\/([^/]+)/)?.[1];
  const modelsHref = organizationId
    ? `/org/${organizationId}/models`
    : "/workspace";
  const [modalState, setModalState] = useState<ModalState>(null);
  const [providerPendingDelete, setProviderPendingDelete] =
    useState<ProviderListItem | null>(null);
  const [isSubmitting, startSubmitting] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const canCreate = hasPermission(role, "llmProvider", "create");
  const canUpdate = hasPermission(role, "llmProvider", "update");
  const canDelete = hasPermission(role, "llmProvider", "delete");

  const stats = useMemo(() => {
    const activeCount = providers.filter(
      (provider) => provider.isActive,
    ).length;
    const openAiCount = providers.filter(
      (provider) => provider.compatibilityType === "openai",
    ).length;
    const anthropicCount = providers.filter(
      (provider) => provider.compatibilityType === "anthropic",
    ).length;

    return {
      total: providers.length,
      active: activeCount,
      inactive: providers.length - activeCount,
      openai: openAiCount,
      anthropic: anthropicCount,
    };
  }, [providers]);

  const handleCreate = async (
    values: ReturnType<typeof createProviderInputSchema.parse>,
  ) => {
    startSubmitting(async () => {
      const result = await createProvider(values);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);
      setModalState(null);
      router.refresh();
    });
  };

  const handleUpdate = async (
    provider: ProviderListItem,
    values: Omit<ReturnType<typeof updateProviderInputSchema.parse>, "id">,
  ) => {
    startSubmitting(async () => {
      const result = await updateProvider({
        id: provider.id,
        ...values,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);
      setModalState(null);
      router.refresh();
    });
  };

  const handleDelete = async () => {
    if (!providerPendingDelete) {
      return;
    }

    setDeletingId(providerPendingDelete.id);
    const result = await deleteProvider(providerPendingDelete.id);
    setDeletingId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    setProviderPendingDelete(null);
    router.refresh();
  };

  return (
    <>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <MetricCard label="Total" value={stats.total.toString()} />
        <MetricCard label="Active" value={stats.active.toString()} />
        <MetricCard label="Inactive" value={stats.inactive.toString()} />
        <MetricCard label="OpenAI" value={stats.openai.toString()} />
        <MetricCard label="Anthropic" value={stats.anthropic.toString()} />
      </section>

      <Card className="border-border bg-card shadow-card">
        <CardHeader className="flex flex-col gap-3 border-b border-border sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Configured providers</CardTitle>
            <CardDescription>
              {stats.total === 0
                ? hasProviderListFilters(query)
                  ? "No providers match these filters."
                  : "No providers yet — add an upstream endpoint to begin."
                : `${stats.total} provider${stats.total === 1 ? "" : "s"} in this workspace.`}
            </CardDescription>
          </div>
          {canCreate ? (
            <Button size="sm" onClick={() => setModalState({ mode: "create" })}>
              <Plus className="size-3.5" />
              Add provider
            </Button>
          ) : null}
        </CardHeader>
        <div className="border-b border-border px-4 py-3 sm:px-5">
          <ProviderListFilters query={query} />
        </div>
        <CardContent className="p-0">
          {providers.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-medium text-text-primary">
                {hasProviderListFilters(query)
                  ? "No matching providers"
                  : "No providers configured"}
              </p>
              <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-5 text-text-secondary">
                {hasProviderListFilters(query)
                  ? "Try a different name or compatibility type, or clear the filters."
                  : "Add an upstream URL and encrypted API key to enable routing and model pricing for this workspace."}
              </p>
              {canCreate ? (
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={() => setModalState({ mode: "create" })}
                >
                  <Plus className="size-3.5" />
                  Add provider
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="flex flex-col gap-3 px-4 py-3.5 sm:px-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold tracking-[-0.01em] text-text-primary">
                        {provider.name}
                      </p>
                      <Badge
                        variant={provider.isActive ? "success" : "warning"}
                      >
                        {provider.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge
                        variant="neutral"
                        className="font-mono text-[11px] uppercase"
                      >
                        {provider.compatibilityType}
                      </Badge>
                    </div>
                    <p className="truncate font-mono text-[12px] text-text-tertiary">
                      {provider.apiUrl}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      Updated {formatDate(provider.updatedAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-1.5 self-start lg:self-center">
                    <Link
                      href={modelsHref}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                      )}
                    >
                      <Boxes className="size-3.5" />
                      Models
                    </Link>
                    {canUpdate ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setModalState({ mode: "edit", provider })}
                      >
                        <PencilLine className="size-3.5" />
                        Edit
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-error hover:bg-error-bg hover:text-error"
                        disabled={deletingId === provider.id}
                        onClick={() => setProviderPendingDelete(provider)}
                      >
                        <Trash2 className="size-3.5" />
                        {deletingId === provider.id ? "Deleting..." : "Delete"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ProviderFormModal
        open={modalState !== null}
        mode={modalState?.mode ?? "create"}
        provider={modalState?.mode === "edit" ? modalState.provider : undefined}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (isSubmitting) {
            return;
          }

          setModalState(null);
        }}
        onSubmit={(values) => {
          if (modalState?.mode === "edit") {
            return handleUpdate(
              modalState.provider,
              values as Omit<
                ReturnType<typeof updateProviderInputSchema.parse>,
                "id"
              >,
            );
          }

          return handleCreate(
            values as ReturnType<typeof createProviderInputSchema.parse>,
          );
        }}
      />

      <AlertDialog
        open={providerPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && deletingId === null) {
            setProviderPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {providerPendingDelete?.name ?? "provider"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the provider record and removes it from
              routing. This action cannot be undone.
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
              disabled={providerPendingDelete === null || deletingId !== null}
            >
              {deletingId !== null ? "Deleting..." : "Delete provider"}
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
