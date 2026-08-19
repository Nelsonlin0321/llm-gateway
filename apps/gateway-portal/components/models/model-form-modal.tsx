"use client";

import { useMemo, useState, type ComponentProps } from "react";
import { X } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  createModelInputSchema,
  parseModelAliasSuffix,
  updateModelInputSchema,
  type ModelListItem,
  type ProviderSummary,
} from "@/lib/model/schema";

type ModelFormMode = "create" | "edit";

type ModelFormValues = {
  name: string;
  alias: string;
  inputPrice: string;
  outputPrice: string;
  inputCachePrice: string;
};

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

type ModelFormModalProps = {
  mode: ModelFormMode;
  open: boolean;
  providers: ProviderSummary[];
  model?: ModelListItem;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (
    values:
      | z.infer<typeof createModelInputSchema>
      | z.infer<typeof updateModelInputSchema>,
  ) => Promise<void>;
};

const inputClassName =
  "h-10 w-full rounded-md border border-border-visible bg-transparent px-3 text-sm text-foreground transition-[border-color,box-shadow] placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-3 focus:ring-ring/40";

const fieldLabelClassName =
  "text-sm font-medium tracking-[-0.01em] text-text-primary";

function getInitialValues(
  providerName: string,
  model?: ModelListItem,
): ModelFormValues {
  if (!model) {
    return {
      name: "",
      alias: "",
      inputPrice: "",
      outputPrice: "",
      inputCachePrice: "",
    };
  }

  return {
    name: model.name,
    alias: parseModelAliasSuffix(providerName, model.alias),
    inputPrice: String(model.inputPrice),
    outputPrice: String(model.outputPrice),
    inputCachePrice: String(model.inputCachePrice),
  };
}

export function ModelFormModal({
  mode,
  open,
  providers,
  model,
  isSubmitting,
  onClose,
  onSubmit,
}: ModelFormModalProps) {
  const initialProvider =
    providers.find((item) => item.id === model?.providerId) ?? providers[0];
  const [providerId, setProviderId] = useState(initialProvider?.id ?? "");
  const providerName =
    providers.find((item) => item.id === providerId)?.name ??
    model?.providerName ??
    "provider";
  const [values, setValues] = useState<ModelFormValues>(() =>
    getInitialValues(providerName, model),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});

  const title = useMemo(
    () =>
      mode === "create"
        ? "Register model"
        : `Edit ${model?.name ?? "model"}`,
    [mode, model?.name],
  );

  if (!open) {
    return null;
  }

  const updateValue = <T extends keyof ModelFormValues>(
    key: T,
    value: ModelFormValues[T],
  ) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault();

    const aliasSuffix = values.alias.trim() || values.name.trim();
    const fields = {
      name: values.name,
      alias: aliasSuffix,
      inputPrice: values.inputPrice,
      outputPrice: values.outputPrice,
      inputCachePrice: values.inputCachePrice,
    };

    const parsed =
      mode === "create"
        ? createModelInputSchema.safeParse({
            providerId,
            ...fields,
          })
        : updateModelInputSchema.safeParse({
            id: model?.id,
            ...fields,
          });

    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error as z.ZodError).fieldErrors);
      return;
    }

    setFieldErrors({});
    await onSubmit(parsed.data);

    if (mode === "create") {
      setValues(getInitialValues(providerName));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--or-ink)_72%,transparent)] p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="model-form-title"
        className="w-full max-w-xl rounded-xl border border-border-visible bg-popover shadow-hero"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="space-y-1">
            <h2
              id="model-form-title"
              className="font-heading text-[1.25rem] leading-[1.15] font-semibold tracking-[-0.02em]"
            >
              {title}
            </h2>
            <p className="max-w-lg text-sm leading-5 text-text-secondary">
              Prices are USD per 1M tokens. Downstream routes are{" "}
              <span className="font-mono text-text-primary">
                {providerName}/
              </span>
              plus the model segment you enter.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close model form"
          >
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="model-provider" className={fieldLabelClassName}>
                Provider
              </label>
              <select
                id="model-provider"
                value={providerId}
                disabled={mode === "edit" || isSubmitting}
                onChange={(event) => setProviderId(event.target.value)}
                className={inputClassName}
              >
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                    {provider.isActive ? "" : " (inactive)"}
                  </option>
                ))}
              </select>
              <FieldError errors={fieldErrors.providerId} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="model-name" className={fieldLabelClassName}>
                Model name
              </label>
              <input
                id="model-name"
                value={values.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setValues((current) => ({
                    ...current,
                    name,
                    alias:
                      current.alias === "" || current.alias === current.name
                        ? name
                        : current.alias,
                  }));
                }}
                placeholder="gpt-4.1"
                className={inputClassName}
                autoComplete="off"
              />
              <p className="text-xs text-text-tertiary">
                Upstream model identifier. Names do not need to be unique.
              </p>
              <FieldError errors={fieldErrors.name} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="model-alias" className={fieldLabelClassName}>
                Downstream model name
              </label>
              <div className="flex h-10 w-full overflow-hidden rounded-md border border-border-visible focus-within:border-accent focus-within:ring-3 focus-within:ring-ring/40">
                <span
                  className="flex shrink-0 items-center border-r border-border-visible bg-surface-2 px-3 font-mono text-sm text-text-secondary select-none"
                  aria-hidden
                >
                  {providerName}/
                </span>
                <input
                  id="model-alias"
                  value={values.alias}
                  onChange={(event) =>
                    updateValue(
                      "alias",
                      event.target.value.replace(/^\/+/, "").replace(/\//g, ""),
                    )
                  }
                  placeholder="gpt-4.1"
                  className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-text-tertiary"
                  autoComplete="off"
                  aria-describedby="model-alias-help"
                />
              </div>
              <p
                id="model-alias-help"
                className="font-mono text-xs text-text-tertiary"
              >
                Full route: {providerName}/{values.alias.trim() || "…"}
              </p>
              <FieldError errors={fieldErrors.alias} />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="model-input-price"
                className={fieldLabelClassName}
              >
                Input price / 1M tokens
              </label>
              <input
                id="model-input-price"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={values.inputPrice}
                onChange={(event) =>
                  updateValue("inputPrice", event.target.value)
                }
                placeholder="2.50"
                className={inputClassName}
              />
              <FieldError errors={fieldErrors.inputPrice} />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="model-output-price"
                className={fieldLabelClassName}
              >
                Output price / 1M tokens
              </label>
              <input
                id="model-output-price"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={values.outputPrice}
                onChange={(event) =>
                  updateValue("outputPrice", event.target.value)
                }
                placeholder="10.00"
                className={inputClassName}
              />
              <FieldError errors={fieldErrors.outputPrice} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label
                htmlFor="model-input-cache-price"
                className={fieldLabelClassName}
              >
                Input cache price / 1M tokens
              </label>
              <input
                id="model-input-cache-price"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={values.inputCachePrice}
                onChange={(event) =>
                  updateValue("inputCachePrice", event.target.value)
                }
                placeholder="1.25"
                className={inputClassName}
              />
              <FieldError errors={fieldErrors.inputCachePrice} />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2.5 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="default"
              className="w-full sm:w-auto"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="default"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? mode === "create"
                  ? "Registering..."
                  : "Saving..."
                : mode === "create"
                  ? "Register model"
                  : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-sm text-error">{errors[0]}</p>;
}
