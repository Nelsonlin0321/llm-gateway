"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { createModel } from "@/app/server-actions/model/create-model";
import { ModelFormModal } from "@/components/models/model-form-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  ModelListItem,
  ProviderSummary,
} from "@/lib/model/schema";
import { createModelInputSchema } from "@/lib/model/schema";
import type { z } from "zod";

type ModelManagementClientProps = {
  provider: ProviderSummary;
  models: ModelListItem[];
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
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, startSubmitting] = useTransition();

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
      setModalOpen(false);
      router.refresh();
    });
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
          <Button onClick={() => setModalOpen(true)}>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ModelFormModal
        open={modalOpen}
        providerId={provider.id}
        providerName={provider.name}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setModalOpen(false);
          }
        }}
        onSubmit={handleCreate}
      />
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
