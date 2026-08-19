"use client";

import { useState, type ComponentProps } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { slugifyOrganizationName } from "@/lib/organization/slug";

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

type CreateOrganizationModalProps = {
  open: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string; slug: string }) => Promise<void>;
};

const inputClassName =
  "h-10 w-full rounded-md border border-border-visible bg-transparent px-3 text-sm text-foreground transition-[border-color,box-shadow] placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-3 focus:ring-ring/40";

export function CreateOrganizationModal({
  open,
  isSubmitting,
  onClose,
  onSubmit,
}: CreateOrganizationModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault();
    const nextName = name.trim();
    const nextSlug = slugifyOrganizationName(slug || nextName);

    if (!nextName) {
      setError("Organization name is required.");
      return;
    }

    setError(null);
    await onSubmit({ name: nextName, slug: nextSlug });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--or-ink)_72%,transparent)] p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-org-title"
        className="w-full max-w-lg rounded-xl border border-border-visible bg-popover shadow-hero"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="space-y-1">
            <h2
              id="create-org-title"
              className="font-heading text-[1.25rem] leading-[1.15] font-semibold tracking-[-0.02em]"
            >
              Create organization
            </h2>
            <p className="text-sm leading-5 text-text-secondary">
              You become the root member of the new organization.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            <X />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div className="space-y-2">
            <label htmlFor="org-name" className="text-sm font-medium text-text-primary">
              Name
            </label>
            <input
              id="org-name"
              value={name}
              onChange={(event) => {
                const nextName = event.target.value;
                setName(nextName);
                if (!slugTouched) {
                  setSlug(slugifyOrganizationName(nextName));
                }
              }}
              placeholder="Acme Engineering"
              required
              className={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="org-slug" className="text-sm font-medium text-text-primary">
              Slug
            </label>
            <input
              id="org-slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(slugifyOrganizationName(event.target.value));
              }}
              placeholder="acme-engineering"
              required
              className={inputClassName}
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-md border border-error/20 bg-error-bg px-3 py-2.5 text-sm text-error"
            >
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create organization"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
