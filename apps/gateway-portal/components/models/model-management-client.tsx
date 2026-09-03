"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  FlaskConical,
  PencilLine,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { z } from "zod";

import { createModel } from "@/app/server-actions/model/create-model";
import { deleteModel } from "@/app/server-actions/model/delete-model";
import { testModel } from "@/app/server-actions/model/test-model";
import { updateModel } from "@/app/server-actions/model/update-model";
import { BuiltInProviderIcon } from "@/components/llm-providers/built-in-provider-icon";
import { ModelFormModal } from "@/components/models/model-form-modal";
import { ModelListFilters } from "@/components/models/model-list-filters";
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
  createModelInputSchema,
  hasModelListFilters,
  updateModelInputSchema,
  type ModelListItem,
  type ModelListQuery,
  type ProviderSummary,
} from "@/lib/model/schema";
import { hasPermission, type Role } from "@/lib/organization/permissions";
import { cn } from "@/lib/utils";

type ModelManagementClientProps = {
  organizationId: string;
  providers: ProviderSummary[];
  models: ModelListItem[];
  query?: ModelListQuery;
  role?: Role | null;
};

type ModalState =
  { mode: "create" } | { mode: "edit"; model: ModelListItem } | null;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(value);
}

export function ModelManagementClient({
  organizationId,
  providers,
  models,
  query = {},
  role = null,
}: ModelManagementClientProps) {
  const router = useRouter();
  const [modalState, setModalState] = useState<ModalState>(null);
  const [modelPendingDelete, setModelPendingDelete] =
    useState<ModelListItem | null>(null);
  const [isSubmitting, startSubmitting] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [copiedAliasId, setCopiedAliasId] = useState<string | null>(null);
  const canCreate = hasPermission(role, "model", "create");
  const canUpdate = hasPermission(role, "model", "update");
  const canDelete = hasPermission(role, "model", "delete");

  const stats = useMemo(() => {
    const avgOutput =
      models.length === 0
        ? 0
        : models.reduce((sum, model) => sum + model.outputPrice, 0) /
          models.length;

    return {
      total: models.length,
      providers: providers.length,
      avgOutput,
    };
  }, [models, providers.length]);

  const handleCreate = async (
    values: z.infer<typeof createModelInputSchema>,
  ) => {
    startSubmitting(async () => {
      const result = await createModel(values);

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
    model: ModelListItem,
    values: Omit<z.infer<typeof updateModelInputSchema>, "id">,
  ) => {
    startSubmitting(async () => {
      const result = await updateModel({
        id: model.id,
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

  const handleTest = async (model: ModelListItem) => {
    setTestingId(model.id);
    try {
      const result = await testModel(model.id);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async () => {
    if (!modelPendingDelete) {
      return;
    }

    setDeletingId(modelPendingDelete.id);
    const result = await deleteModel(modelPendingDelete.id);
    setDeletingId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    setModelPendingDelete(null);
    router.refresh();
  };

  const handleCopyAlias = async (model: ModelListItem) => {
    try {
      await navigator.clipboard.writeText(model.alias);
      setCopiedAliasId(model.id);
      toast.success("Model alias copied to clipboard.");
      window.setTimeout(() => {
        setCopiedAliasId((current) => (current === model.id ? null : current));
      }, 1600);
    } catch {
      toast.error("Unable to copy model alias.");
    }
  };

  return (
    <>
      <section className="grid grid-cols-3 gap-3">
        <MetricCard label="Models" value={stats.total.toString()} />
        <MetricCard label="Providers" value={stats.providers.toString()} />
        <MetricCard
          label="Avg output / 1M"
          value={models.length ? formatPrice(stats.avgOutput) : "—"}
        />
      </section>

      <Card className="border-border bg-card shadow-card">
        <CardHeader className="flex flex-col gap-3 border-b border-border sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Registered models</CardTitle>
            <CardDescription>
              {models.length === 0
                ? hasModelListFilters(query)
                  ? "No models match these filters."
                  : "All models for this organization, across every connected provider."
                : `${models.length} model${models.length === 1 ? "" : "s"} in this organization.`}
            </CardDescription>
          </div>
          {canCreate ? (
            <Button
              size="sm"
              disabled={providers.length === 0}
              onClick={() => setModalState({ mode: "create" })}
            >
              <Plus className="size-3.5" />
              Add model
            </Button>
          ) : null}
        </CardHeader>
        <div className="border-b border-border px-4 py-3 sm:px-5">
          <ModelListFilters query={query} providers={providers} />
        </div>
        <CardContent className="p-0">
          {models.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-medium text-text-primary">
                {hasModelListFilters(query)
                  ? "No matching models"
                  : "No models registered"}
              </p>
              <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-5 text-text-secondary">
                {hasModelListFilters(query)
                  ? "Try a different name, provider, or compatibility type, or clear the filters."
                  : providers.length === 0
                    ? "Connect a provider first, then register models with input, output, and cache prices."
                    : "Add a model with input, output, and cache prices so routing and cost attribution can use this organization."}
              </p>
              {hasModelListFilters(query) ? null : providers.length === 0 ? (
                hasPermission(role, "llmProvider", "create") ? (
                  <Link
                    href={`/org/${organizationId}/providers`}
                    className={cn(buttonVariants({ size: "sm" }), "mt-4")}
                  >
                    <Plus className="size-3.5" />
                    Add provider
                  </Link>
                ) : null
              ) : canCreate ? (
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={() => setModalState({ mode: "create" })}
                >
                  <Plus className="size-3.5" />
                  Add model
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {models.map((model) => (
                <div
                  key={model.id}
                  className="flex flex-col gap-3 px-4 py-3.5 sm:px-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        aria-hidden
                        className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2"
                      >
                        <BuiltInProviderIcon
                          key={model.providerName}
                          name={model.providerName}
                          className="bg-transparent"
                        />
                      </span>
                      <p className="text-sm font-semibold tracking-[-0.01em] text-text-primary">
                        {model.alias}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        className="h-7 px-2 text-text-secondary hover:text-text-primary"
                        onClick={() => void handleCopyAlias(model)}
                        aria-label={
                          copiedAliasId === model.id
                            ? `Copied alias ${model.alias}`
                            : `Copy alias ${model.alias}`
                        }
                        title={
                          copiedAliasId === model.id ? "Copied" : "Copy alias"
                        }
                      >
                        {copiedAliasId === model.id ? (
                          <Check className="size-3.5" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-text-secondary">
                      <Badge
                        variant="neutral"
                        className="font-mono text-[11px]"
                      >
                        {model.name}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-text-secondary">
                      <span className="rounded-sm border border-border bg-surface-2 px-1.5 py-0.5 font-mono tabular-nums">
                        in {formatPrice(model.inputPrice)}
                      </span>
                      <span className="rounded-sm border border-border bg-surface-2 px-1.5 py-0.5 font-mono tabular-nums">
                        out {formatPrice(model.outputPrice)}
                      </span>
                      <span className="rounded-sm border border-border bg-surface-2 px-1.5 py-0.5 font-mono tabular-nums">
                        cache {formatPrice(model.inputCachePrice)}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted">
                      Updated {formatDate(model.updatedAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-1.5 self-start lg:self-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={testingId === model.id}
                      onClick={() => void handleTest(model)}
                    >
                      <FlaskConical className="size-3.5" />
                      {testingId === model.id ? "Testing..." : "Test"}
                    </Button>
                    {canUpdate ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setModalState({ mode: "edit", model })}
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
                        disabled={deletingId === model.id}
                        onClick={() => setModelPendingDelete(model)}
                      >
                        <Trash2 className="size-3.5" />
                        {deletingId === model.id
                          ? "Deregistering..."
                          : "Deregister"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ModelFormModal
        key={
          modalState?.mode === "edit"
            ? `edit-${modalState.model.id}`
            : modalState?.mode === "create"
              ? "create"
              : "closed"
        }
        open={modalState !== null}
        mode={modalState?.mode ?? "create"}
        providers={providers}
        model={modalState?.mode === "edit" ? modalState.model : undefined}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setModalState(null);
          }
        }}
        onSubmit={async (values) => {
          if (modalState?.mode === "edit") {
            return handleUpdate(
              modalState.model,
              values as Omit<z.infer<typeof updateModelInputSchema>, "id">,
            );
          }

          return handleCreate(values as z.infer<typeof createModelInputSchema>);
        }}
      />

      <AlertDialog
        open={modelPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && deletingId === null) {
            setModelPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Deregister {modelPendingDelete?.name ?? "model"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes{" "}
              <span className="font-mono text-text-primary">
                {modelPendingDelete?.alias ?? "this model"}
              </span>{" "}
              and its pricing metadata from this provider. Routing that depends
              on this alias will stop working. This cannot be undone.
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
              disabled={modelPendingDelete === null || deletingId !== null}
            >
              {deletingId !== null ? "Deregistering..." : "Deregister model"}
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
