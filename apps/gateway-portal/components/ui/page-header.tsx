import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
};

/**
 * Compact product page chrome for workspace surfaces.
 * Prefer this over marketing-style hero cards on admin pages.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1.5">
        {eyebrow ? (
          <p className="text-[11px] font-medium tracking-[0.14em] text-text-tertiary uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-heading text-[1.5rem] leading-tight font-semibold tracking-[-0.03em] text-text-primary sm:text-[1.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-text-secondary">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
