import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium tracking-[-0.01em] whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        neutral:
          "border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-secondary text-[color:var(--text-secondary)]",
        info: "border-transparent bg-[color:var(--accent-subtle)] text-accent",
        success:
          "border-transparent bg-[color:var(--success-bg)] text-[color:var(--success)]",
        warning:
          "border-transparent bg-[color:var(--warning-bg)] text-[color:var(--warning)]",
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
