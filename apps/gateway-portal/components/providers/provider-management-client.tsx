"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, KeyRound, PencilLine, Plus, Power, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { createProvider } from "@/app/server-actions/llm-provider/create-provider";
import { deleteProvider } from "@/app/server-actions/llm-provider/delete-provider";
import { updateProvider } from "@/app/server-actions/llm-provider/update-provider";
import { ProviderFormModal } from "@/components/providers/provider-form-modal";
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
  createProviderInputSchema,
  type ProviderListItem,
  updateProviderInputSchema,
} from "@/lib/llm-provider/schema";

type ProviderManagementClientProps = {
  providers: ProviderListItem[];
};

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; provider: ProviderListItem }
  | null;

function formatPrice(value: number | null) {
  if (value === null) {
    return "Not set";
  }

  return `$${value.toFixed(4)}`;
}

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
}: ProviderManagementClientProps) {
  const router = useRouter();
  const [modalState, setModalState] = useState<ModalState>(null);
  const [isSubmitting, startSubmitting] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const activeCount = providers.filter((provider) => provider.isActive).length;
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

  const handleDelete = async (provider: ProviderListItem) => {
    const confirmed = window.confirm(
      `Delete ${provider.name}? This is a soft delete and the provider will be marked inactive.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(provider.id);
    const result = await deleteProvider(provider.id);
    setDeletingId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    router.refresh();
  };

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Providers"
          value={stats.total.toString()}
          detail="All stored configurations"
        />
        <MetricCard
          label="Active"
          value={stats.active.toString()}
          detail="Available for routing"
        />
        <MetricCard
          label="Inactive"
          value={stats.inactive.toString()}
          detail="Disabled or soft deleted"
        />
        <MetricCard
          label="OpenAI"
          value={stats.openai.toString()}
          detail="OpenAI-compatible endpoints"
        />
        <MetricCard
          label="Anthropic"
          value={stats.anthropic.toString()}
          detail="Anthropic-compatible endpoints"
        />
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-[1.8rem]">Configured providers</CardTitle>
            <CardDescription>
              Keep upstream credentials centralized, control which providers are active, and
              manage pricing metadata without ever exposing stored API keys.
            </CardDescription>
          </div>
          <Button size="lg" onClick={() => setModalState({ mode: "create" })}>
            <Plus className="size-4" />
            Add provider
          </Button>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-strong bg-background px-6 py-12 text-center">
              <p className="text-lg font-medium text-text-primary">
                No providers configured yet.
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                Add your first provider to store the upstream URL, encrypted API key, and pricing
                metadata.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {providers.map((provider) => (
                <Card
                  key={provider.id}
                  className="border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-background"
                >
                  <CardHeader className="gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-[1.4rem]">{provider.name}</CardTitle>
                          <Badge variant={provider.isActive ? "success" : "warning"}>
                            {provider.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="neutral">{provider.compatibilityType}</Badge>
                        </div>
                        <CardDescription className="break-all">
                          {provider.apiUrl}
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setModalState({ mode: "edit", provider })}
                        >
                          <PencilLine className="size-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === provider.id}
                          onClick={() => handleDelete(provider)}
                        >
                          <Trash2 className="size-4" />
                          {deletingId === provider.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoChip
                        icon={KeyRound}
                        label="Stored key"
                        value={provider.hasStoredApiKey ? "Encrypted" : "Missing"}
                      />
                      <InfoChip
                        icon={Power}
                        label="Routing status"
                        value={provider.isActive ? "Enabled" : "Disabled"}
                      />
                      <InfoChip
                        icon={CheckCircle2}
                        label="Input price"
                        value={formatPrice(provider.inputPrice)}
                      />
                      <InfoChip
                        icon={CheckCircle2}
                        label="Output price"
                        value={formatPrice(provider.outputPrice)}
                      />
                    </div>

                    <div className="rounded-2xl border border-border bg-surface-1 px-4 py-3">
                      <p className="text-sm font-medium text-text-primary">
                        Input cache price
                      </p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {formatPrice(provider.inputCachePrice)}
                      </p>
                    </div>

                    <p className="text-xs uppercase tracking-[0.08em] text-text-tertiary">
                      Last updated {formatDate(provider.updatedAt)}
                    </p>
                  </CardContent>
                </Card>
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
            return handleUpdate(modalState.provider, values as Omit<
              ReturnType<typeof updateProviderInputSchema.parse>,
              "id"
            >);
          }

          return handleCreate(values as ReturnType<typeof createProviderInputSchema.parse>);
        }}
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
    <Card className="bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-1)_96%,transparent),color-mix(in_srgb,var(--surface-1)_80%,transparent))]">
      <CardHeader className="pb-3">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-[2rem]">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-text-secondary">{detail}</p>
      </CardContent>
    </Card>
  );
}

function InfoChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-1 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Icon className="size-4" />
        {label}
      </div>
      <p className="mt-2 text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}
