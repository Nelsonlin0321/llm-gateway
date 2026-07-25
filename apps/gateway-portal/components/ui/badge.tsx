import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] leading-5 font-medium tracking-[0.02em] whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        neutral:
          "border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-1)_88%,transparent)] text-[color:var(--text-secondary)]",
        info:
          "border-[color:color-mix(in_srgb,var(--accent)_22%,transparent)] bg-[color:var(--accent-subtle)] text-accent",
        success:
          "border-[color:color-mix(in_srgb,var(--success)_18%,transparent)] bg-[color:var(--success-bg)] text-[color:var(--success)]",
        warning:
          "border-[color:color-mix(in_srgb,var(--warning)_18%,transparent)] bg-[color:var(--warning-bg)] text-[color:var(--warning)]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  return (
    <div
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
