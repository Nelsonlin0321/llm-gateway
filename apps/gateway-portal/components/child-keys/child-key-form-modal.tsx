"use client";

import { useState, type ComponentProps } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { createChildKeyInputSchema } from "@/lib/child-key/schema";

type TagRow = {
  id: string;
  key: string;
  value: string;
};

type FormValues = {
  name: string;
  userEmail: string;
};

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

type ChildKeyFormModalProps = {
  open: boolean;
  defaultUserEmail: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (
    values: z.infer<typeof createChildKeyInputSchema>,
  ) => Promise<void>;
};

const inputClassName =
  "h-10 w-full rounded-md border border-border-visible bg-transparent px-3 text-sm text-foreground transition-[border-color,box-shadow] placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-3 focus:ring-ring/40";

const fieldLabelClassName =
  "text-sm font-medium tracking-[-0.01em] text-text-primary";

const SUGGESTED_TAG_KEYS = ["env", "project", "team", "application", "owner"];

function createTagRow(partial?: Partial<TagRow>): TagRow {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `tag-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    key: partial?.key ?? "",
    value: partial?.value ?? "",
  };
}

function emptyValues(defaultUserEmail: string): FormValues {
  return {
    name: "",
    userEmail: defaultUserEmail,
  };
}

function emptyTagRows(): TagRow[] {
  return [createTagRow({ key: "env" })];
}

export function ChildKeyFormModal({
  open,
  defaultUserEmail,
  isSubmitting,
  onClose,
  onSubmit,
}: ChildKeyFormModalProps) {
  const [values, setValues] = useState<FormValues>(() =>
    emptyValues(defaultUserEmail),
  );
  const [tagRows, setTagRows] = useState<TagRow[]>(() => emptyTagRows());
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});
  const [tagsError, setTagsError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const updateValue = <T extends keyof FormValues>(
    key: T,
    value: FormValues[T],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const updateTagRow = (
    id: string,
    field: "key" | "value",
    value: string,
  ) => {
    setTagRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const addTagRow = () => {
    setTagRows((current) => [...current, createTagRow()]);
  };

  const removeTagRow = (id: string) => {
    setTagRows((current) => {
      if (current.length <= 1) {
        return [createTagRow()];
      }
      return current.filter((row) => row.id !== id);
    });
  };

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault();

    const tags: Record<string, string> = {};
    for (const row of tagRows) {
      const key = row.key.trim();
      const value = row.value.trim();
      if (!key && !value) {
        continue;
      }
      tags[key] = value;
    }

    const parsed = createChildKeyInputSchema.safeParse({
      name: values.name,
      userEmail: values.userEmail,
      tags,
    });

    if (!parsed.success) {
      const flattened = z.flattenError(parsed.error as z.ZodError);
      const fieldErrors = flattened.fieldErrors as Record<
        string,
        string[] | undefined
      >;
      setFieldErrors(fieldErrors);
      const formErrors = flattened.formErrors;
      const tagFieldError = fieldErrors.tags?.[0];
      setTagsError(tagFieldError ?? formErrors[0] ?? null);
      return;
    }

    setFieldErrors({});
    setTagsError(null);
    await onSubmit(parsed.data);
    setValues(emptyValues(defaultUserEmail));
    setTagRows(emptyTagRows());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--or-ink)_72%,transparent)] p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="child-key-form-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-border-visible bg-popover shadow-hero"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="space-y-1">
            <h2
              id="child-key-form-title"
              className="font-heading text-[1.25rem] leading-[1.15] font-semibold tracking-[-0.02em]"
            >
              Create child API key
            </h2>
            <p className="max-w-lg text-sm leading-5 text-text-secondary">
              Generates a signed <span className="font-mono">sk_live_</span> JWT.
              Add any tags you need — env, project, team, or custom labels.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close child key form"
          >
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
          <div className="grid gap-4">
            <div className="space-y-2">
              <label htmlFor="child-key-name" className={fieldLabelClassName}>
                Name
              </label>
              <input
                id="child-key-name"
                value={values.name}
                onChange={(event) => updateValue("name", event.target.value)}
                placeholder="team-growth-prod"
                className={inputClassName}
                autoComplete="off"
              />
              <FieldError errors={fieldErrors.name} />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="child-key-user-email"
                className={fieldLabelClassName}
              >
                User email
              </label>
              <input
                id="child-key-user-email"
                type="email"
                value={values.userEmail}
                onChange={(event) =>
                  updateValue("userEmail", event.target.value)
                }
                placeholder="owner@company.com"
                className={inputClassName}
                autoComplete="email"
              />
              <p className="text-xs text-text-tertiary">
                Embedded in the JWT as{" "}
                <span className="font-mono">user_email</span>.
              </p>
              <FieldError errors={fieldErrors.userEmail} />
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className={fieldLabelClassName}>Tags</p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    Optional free-form key/value pairs. Common keys:{" "}
                    {SUGGESTED_TAG_KEYS.join(", ")}.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addTagRow}
                  disabled={isSubmitting || tagRows.length >= 24}
                >
                  <Plus className="size-3.5" />
                  Add tag
                </Button>
              </div>

              <div className="space-y-2">
                {tagRows.map((row, index) => (
                  <div
                    key={row.id}
                    className="grid gap-2 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_auto]"
                  >
                    <input
                      aria-label={`Tag key ${index + 1}`}
                      value={row.key}
                      onChange={(event) =>
                        updateTagRow(row.id, "key", event.target.value)
                      }
                      placeholder="env"
                      list="child-key-tag-suggestions"
                      className={inputClassName}
                      autoComplete="off"
                    />
                    <input
                      aria-label={`Tag value ${index + 1}`}
                      value={row.value}
                      onChange={(event) =>
                        updateTagRow(row.id, "value", event.target.value)
                      }
                      placeholder="prod"
                      className={inputClassName}
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="h-10 w-10 shrink-0"
                      onClick={() => removeTagRow(row.id)}
                      disabled={isSubmitting}
                      aria-label={`Remove tag ${index + 1}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <datalist id="child-key-tag-suggestions">
                {SUGGESTED_TAG_KEYS.map((key) => (
                  <option key={key} value={key} />
                ))}
              </datalist>

              {tagsError ? (
                <p className="text-sm text-error">{tagsError}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2.5 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create child key"}
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
