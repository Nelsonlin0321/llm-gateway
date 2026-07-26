import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/* OpenRouter: 4px element radius (not full pill) for status chips */
const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-[12px] leading-5 font-medium tracking-[0.01em] whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        neutral:
          "border-border bg-surface-2 text-text-secondary",
        info:
          "border-transparent bg-accent-subtle text-accent",
        success:
          "border-transparent bg-success-bg text-success",
        warning:
          "border-transparent bg-warning-bg text-warning",
        error:
          "border-transparent bg-error-bg text-error",
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
