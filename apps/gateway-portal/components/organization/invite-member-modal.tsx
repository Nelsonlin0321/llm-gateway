"use client";

import { useState, type ComponentProps } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ORGANIZATION_ROLE_DESCRIPTIONS,
  ORGANIZATION_ROLE_LABELS,
  type OrganizationRoleName,
} from "@/lib/organization/permissions";

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

type InviteMemberModalProps = {
  open: boolean;
  isSubmitting: boolean;
  assignableRoles: OrganizationRoleName[];
  onClose: () => void;
  onSubmit: (values: { email: string; role: OrganizationRoleName }) => Promise<void>;
};

const inputClassName =
  "h-10 w-full rounded-md border border-border-visible bg-transparent px-3 text-sm text-foreground transition-[border-color,box-shadow] placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-3 focus:ring-ring/40";

export function InviteMemberModal({
  open,
  isSubmitting,
  assignableRoles,
  onClose,
  onSubmit,
}: InviteMemberModalProps) {
  const defaultRole = assignableRoles.includes("viewer")
    ? "viewer"
    : (assignableRoles[0] ?? "viewer");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrganizationRoleName>(defaultRole);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault();
    await onSubmit({
      email: email.trim().toLowerCase(),
      role,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--or-ink)_72%,transparent)] p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-member-title"
        className="w-full max-w-lg rounded-xl border border-border-visible bg-popover shadow-hero"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="space-y-1">
            <h2
              id="invite-member-title"
              className="font-heading text-[1.25rem] leading-[1.15] font-semibold tracking-[-0.02em]"
            >
              Invite member
            </h2>
            <p className="text-sm leading-5 text-text-secondary">
              Send an email invitation to join this organization.
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
            <label
              htmlFor="invite-email"
              className="text-sm font-medium text-text-primary"
            >
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@company.com"
              required
              className={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="invite-role"
              className="text-sm font-medium text-text-primary"
            >
              Role
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as OrganizationRoleName)
              }
              className={inputClassName}
            >
              {assignableRoles.map((value) => (
                <option key={value} value={value}>
                  {ORGANIZATION_ROLE_LABELS[value]}
                </option>
              ))}
            </select>
            <p className="text-[12px] leading-5 text-text-tertiary">
              {ORGANIZATION_ROLE_DESCRIPTIONS[role]}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || assignableRoles.length === 0}>
              {isSubmitting ? "Sending..." : "Send invitation"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
