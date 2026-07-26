"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CheckCircle2,
  KeyRound,
  PencilLine,
  Plus,
  Power,
  Trash2,
} from "lucide-react";
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
  { mode: "create" } | { mode: "edit"; provider: ProviderListItem } | null;

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
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <CardTitle className="text-[1.45rem]">
              Configured providers
            </CardTitle>
            <CardDescription className="leading-6">
              Keep upstream credentials centralized, control which providers are
              active, and manage pricing metadata without ever exposing stored
              API keys.
            </CardDescription>
          </div>
          <Button onClick={() => setModalState({ mode: "create" })}>
            <Plus className="size-4" />
            Add provider
          </Button>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-border-strong bg-background px-5 py-10 text-center">
              <p className="text-base font-medium text-text-primary">
                No providers configured yet.
              </p>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-secondary">
                Add your first provider to store the upstream URL, encrypted API
                key, and pricing metadata.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {providers.map((provider) => (
                <Card
                  key={provider.id}
                  className="border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-background shadow-none"
                >
                  <CardHeader className="gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-[1.15rem]">
                            {provider.name}
                          </CardTitle>
                          <Badge
                            variant={provider.isActive ? "success" : "warning"}
                          >
                            {provider.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge
                            variant="neutral"
                            className="font-mono uppercase"
                          >
                            {provider.compatibilityType}
                          </Badge>
                        </div>
                        <CardDescription className="break-all font-mono text-[12px] leading-5">
                          {provider.apiUrl}
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setModalState({ mode: "edit", provider })
                          }
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
                          {deletingId === provider.id
                            ? "Deleting..."
                            : "Delete"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <InfoChip
                        icon={KeyRound}
                        label="Stored key"
                        value={
                          provider.hasStoredApiKey ? "Encrypted" : "Missing"
                        }
                      />
                      <InfoChip
                        icon={Power}
                        label="Routing status"
                        value={provider.isActive ? "Enabled" : "Disabled"}
                      />
                    </div>

                    <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
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
    <Card className="bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-1)_96%,transparent),color-mix(in_srgb,var(--surface-1)_82%,transparent))] shadow-none">
      <CardHeader className="gap-1 pb-2">
        <CardDescription className="font-mono text-[11px] uppercase tracking-[0.08em]">
          {label}
        </CardDescription>
        <CardTitle className="text-[1.7rem]">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-5 text-text-secondary">{detail}</p>
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
    <div className="rounded-[16px] border border-border bg-surface-1 px-3.5 py-3">
      <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.08em] text-text-tertiary uppercase">
        <Icon className="size-4" />
        {label}
      </div>
      <p className="mt-2 text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}
