"use client";

import { useMemo, useState, type ComponentProps } from "react";
import { X } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  createProviderInputSchema,
  type ProviderListItem,
  updateProviderInputSchema,
} from "@/lib/llm-provider/schema";

type ProviderFormMode = "create" | "edit";

type ProviderFormValues = {
  name: string;
  apiUrl: string;
  apiKey: string;
  compatibilityType: ProviderListItem["compatibilityType"];
  inputPrice: string;
  inputCachePrice: string;
  outputPrice: string;
  isActive: boolean;
};

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

type ProviderFormModalProps = {
  mode: ProviderFormMode;
  open: boolean;
  provider?: ProviderListItem;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (
    values:
      | z.infer<typeof createProviderInputSchema>
      | z.infer<typeof updateProviderInputSchema>,
  ) => Promise<void>;
};

const inputClassName =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-text-tertiary focus:border-accent focus:outline-none";

const fieldLabelClassName = "text-sm font-medium text-text-primary";

function getInitialValues(provider?: ProviderListItem): ProviderFormValues {
  return {
    name: provider?.name ?? "",
    apiUrl: provider?.apiUrl ?? "",
    apiKey: "",
    compatibilityType: provider?.compatibilityType ?? "openai",
    inputPrice: provider?.inputPrice?.toString() ?? "",
    inputCachePrice: provider?.inputCachePrice?.toString() ?? "",
    outputPrice: provider?.outputPrice?.toString() ?? "",
    isActive: provider?.isActive ?? true,
  };
}

export function ProviderFormModal({
  mode,
  open,
  provider,
  isSubmitting,
  onClose,
  onSubmit,
}: ProviderFormModalProps) {
  const [values, setValues] = useState<ProviderFormValues>(
    getInitialValues(provider),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});
  const title = useMemo(
    () =>
      mode === "create"
        ? "Add provider"
        : `Edit ${provider?.name ?? "provider"}`,
    [mode, provider?.name],
  );

  if (!open) {
    return null;
  }

  const updateValue = <T extends keyof ProviderFormValues>(
    key: T,
    value: ProviderFormValues[T],
  ) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault();

    const payload = {
      ...values,
      ...(mode === "edit" && provider ? { id: provider.id } : {}),
    };

    const parsed =
      mode === "create"
        ? createProviderInputSchema.safeParse(payload)
        : updateProviderInputSchema.safeParse(payload);

    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error as z.ZodError).fieldErrors);
      return;
    }

    setFieldErrors({});
    await onSubmit(parsed.data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="provider-form-title"
        className="w-full max-w-2xl rounded-[28px] border border-border bg-surface-1 shadow-hero"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="space-y-1">
            <h2
              id="provider-form-title"
              className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em]"
            >
              {title}
            </h2>
            <p className="text-sm text-text-secondary">
              API keys are encrypted before they are stored. Existing keys are
              never shown back to the client.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close provider form"
          >
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="provider-name" className={fieldLabelClassName}>
                Provider name
              </label>
              <input
                id="provider-name"
                value={values.name}
                onChange={(event) => updateValue("name", event.target.value)}
                placeholder="openai-compatible"
                className={inputClassName}
                autoComplete="off"
              />
              <FieldError errors={fieldErrors.name} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="provider-url" className={fieldLabelClassName}>
                API URL
              </label>
              <input
                id="provider-url"
                type="url"
                value={values.apiUrl}
                onChange={(event) => updateValue("apiUrl", event.target.value)}
                placeholder="https://api.example.com/v1"
                className={inputClassName}
                autoComplete="off"
              />
              <FieldError errors={fieldErrors.apiUrl} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="provider-api-key" className={fieldLabelClassName}>
                API key
              </label>
              <input
                id="provider-api-key"
                type="password"
                value={values.apiKey}
                onChange={(event) => updateValue("apiKey", event.target.value)}
                placeholder={
                  mode === "create"
                    ? "Enter the provider API key"
                    : "Leave blank to keep the current key"
                }
                className={inputClassName}
                autoComplete="new-password"
              />
              <FieldError
                errors={fieldErrors.apiKey}
                helperText={
                  mode === "edit"
                    ? "Leave this blank if the stored API key should stay unchanged."
                    : undefined
                }
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="provider-compatibility"
                className={fieldLabelClassName}
              >
                Compatibility type
              </label>
              <select
                id="provider-compatibility"
                value={values.compatibilityType}
                onChange={(event) =>
                  updateValue(
                    "compatibilityType",
                    event.target.value as ProviderListItem["compatibilityType"],
                  )
                }
                className={inputClassName}
              >
                <option value="openai">openai</option>
                <option value="anthropic">anthropic</option>
              </select>
              <FieldError errors={fieldErrors.compatibilityType} />
            </div>

            <div className="flex items-end">
              <label className="flex w-full items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary">
                <input
                  type="checkbox"
                  checked={values.isActive}
                  onChange={(event) =>
                    updateValue("isActive", event.target.checked)
                  }
                  className="size-4 rounded border-border"
                />
                Active provider
              </label>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="provider-input-price"
                className={fieldLabelClassName}
              >
                Input price / 1M tokens
              </label>
              <input
                id="provider-input-price"
                type="number"
                min="0"
                step="0.000001"
                value={values.inputPrice}
                onChange={(event) =>
                  updateValue("inputPrice", event.target.value)
                }
                placeholder="Optional"
                className={inputClassName}
              />
              <FieldError errors={fieldErrors.inputPrice} />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="provider-cache-price"
                className={fieldLabelClassName}
              >
                Input cache price / 1M tokens
              </label>
              <input
                id="provider-cache-price"
                type="number"
                min="0"
                step="0.000001"
                value={values.inputCachePrice}
                onChange={(event) =>
                  updateValue("inputCachePrice", event.target.value)
                }
                placeholder="Optional"
                className={inputClassName}
              />
              <FieldError errors={fieldErrors.inputCachePrice} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label
                htmlFor="provider-output-price"
                className={fieldLabelClassName}
              >
                Output price / 1M tokens
              </label>
              <input
                id="provider-output-price"
                type="number"
                min="0"
                step="0.000001"
                value={values.outputPrice}
                onChange={(event) =>
                  updateValue("outputPrice", event.target.value)
                }
                placeholder="Optional"
                className={inputClassName}
              />
              <FieldError errors={fieldErrors.outputPrice} />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                  ? "Create provider"
                  : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldError({
  errors,
  helperText,
}: {
  errors?: string[];
  helperText?: string;
}) {
  if (errors?.length) {
    return <p className="text-sm text-error">{errors[0]}</p>;
  }

  if (!helperText) {
    return null;
  }

  return <p className="text-sm text-text-secondary">{helperText}</p>;
}
