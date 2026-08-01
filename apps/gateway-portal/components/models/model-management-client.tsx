"use client";

import { useMemo, useState, useTransition } from "react";
import { FlaskConical, PencilLine, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { z } from "zod";

import { createModel } from "@/app/server-actions/model/create-model";
import { deleteModel } from "@/app/server-actions/model/delete-model";
import { testModel } from "@/app/server-actions/model/test-model";
import { updateModel } from "@/app/server-actions/model/update-model";
import { ModelFormModal } from "@/components/models/model-form-modal";
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
  createModelInputSchema,
  updateModelInputSchema,
  type ModelListItem,
  type ProviderSummary,
} from "@/lib/model/schema";

type ModelManagementClientProps = {
  provider: ProviderSummary;
  models: ModelListItem[];
};

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; model: ModelListItem }
  | null;

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
  provider,
  models,
}: ModelManagementClientProps) {
  const router = useRouter();
  const [modalState, setModalState] = useState<ModalState>(null);
  const [modelPendingDelete, setModelPendingDelete] =
    useState<ModelListItem | null>(null);
  const [isSubmitting, startSubmitting] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const avgInput =
      models.length === 0
        ? 0
        : models.reduce((sum, model) => sum + model.inputPrice, 0) /
          models.length;
    const avgOutput =
      models.length === 0
        ? 0
        : models.reduce((sum, model) => sum + model.outputPrice, 0) /
          models.length;

    return {
      total: models.length,
      avgInput,
      avgOutput,
    };
  }, [models]);

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

  return (
    <>
      <section className="grid grid-cols-3 gap-3">
        <MetricCard label="Models" value={stats.total.toString()} />
        <MetricCard
          label="Avg input / 1M"
          value={models.length ? formatPrice(stats.avgInput) : "—"}
        />
        <MetricCard
          label="Avg output / 1M"
          value={models.length ? formatPrice(stats.avgOutput) : "—"}
        />
      </section>

      <Card className="border-border bg-card shadow-card">
        <CardHeader className="flex flex-col gap-3 border-b border-border sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {provider.name}
              <span className="ml-2 font-normal text-text-secondary">
                models
              </span>
            </CardTitle>
            <CardDescription>
              Upstream model IDs, aliases, and USD pricing per 1M tokens.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setModalState({ mode: "create" })}>
            <Plus className="size-3.5" />
            Add model
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {models.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-medium text-text-primary">
                No models registered
              </p>
              <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-5 text-text-secondary">
                Add a model with input, output, and cache prices so routing and
                cost attribution can use this provider.
              </p>
              <Button
                size="sm"
                className="mt-4"
                onClick={() => setModalState({ mode: "create" })}
              >
                <Plus className="size-3.5" />
                Add model
              </Button>
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
                      <p className="text-sm font-semibold tracking-[-0.01em] text-text-primary">
                        {model.name}
                      </p>
                      <Badge variant="neutral" className="font-mono text-[11px]">
                        {model.alias}
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setModalState({ mode: "edit", model })}
                    >
                      <PencilLine className="size-3.5" />
                      Edit
                    </Button>
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
        providerId={provider.id}
        providerName={provider.name}
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

          return handleCreate(
            values as z.infer<typeof createModelInputSchema>,
          );
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
