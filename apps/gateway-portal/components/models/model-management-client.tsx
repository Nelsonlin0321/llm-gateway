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
      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Models"
          value={stats.total.toString()}
          detail="Registered under this provider"
        />
        <MetricCard
          label="Avg input / 1M"
          value={models.length ? formatPrice(stats.avgInput) : "—"}
          detail="Mean input token price"
        />
        <MetricCard
          label="Avg output / 1M"
          value={models.length ? formatPrice(stats.avgOutput) : "—"}
          detail="Mean output token price"
        />
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <CardTitle className="text-[1.45rem]">Registered models</CardTitle>
            <CardDescription className="leading-6">
              Map upstream model names to gateway aliases and token prices so
              spend and routing stay accurate.
            </CardDescription>
          </div>
          <Button onClick={() => setModalState({ mode: "create" })}>
            <Plus className="size-4" />
            Add model
          </Button>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-strong bg-background px-5 py-10 text-center">
              <p className="text-base font-medium text-text-primary">
                No models registered yet.
              </p>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-secondary">
                Register a model with input, output, and cached-input prices per
                1M tokens so cost estimates and routing can use this provider.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-background">
              {models.map((model, index) => (
                <div
                  key={model.id}
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
                        {model.name}
                      </CardTitle>
                      <Badge variant="neutral" className="font-mono">
                        {model.alias}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
                      <span className="rounded-sm border border-border bg-surface-1 px-2 py-1 font-mono">
                        in {formatPrice(model.inputPrice)}
                      </span>
                      <span className="rounded-sm border border-border bg-surface-1 px-2 py-1 font-mono">
                        out {formatPrice(model.outputPrice)}
                      </span>
                      <span className="rounded-sm border border-border bg-surface-1 px-2 py-1 font-mono">
                        cache {formatPrice(model.inputCachePrice)}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
                      Updated {formatDate(model.updatedAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2 self-start lg:self-center">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={testingId === model.id}
                      onClick={() => void handleTest(model)}
                    >
                      <FlaskConical className="size-4" />
                      {testingId === model.id ? "Testing..." : "Test"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setModalState({ mode: "edit", model })}
                    >
                      <PencilLine className="size-4" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === model.id}
                      onClick={() => setModelPendingDelete(model)}
                    >
                      <Trash2 className="size-4" />
                      {deletingId === model.id ? "Deregistering..." : "Deregister"}
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
