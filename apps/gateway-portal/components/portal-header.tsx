import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PortalHeaderNavItem = {
  label: string;
  href: string;
};

type PortalHeaderProps = {
  navItems: readonly PortalHeaderNavItem[];
};

export function PortalHeader({ navItems }: PortalHeaderProps) {
  return (
    <header className="rounded-lg border border-border bg-surface-1 px-3 py-2.5 sm:px-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-md bg-accent text-[11px] font-bold tracking-tight text-accent-foreground">
            GW
          </div>
          <div className="space-y-0.5">
            <p className="font-heading text-[0.95rem] font-semibold tracking-[-0.02em] text-text-primary">
              LLM Gateway Portal
            </p>
            <p className="text-[12px] text-text-secondary">
              Providers, keys, policies, and analytics
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <nav className="flex items-center gap-0.5 overflow-x-auto pb-0.5 text-sm font-medium text-text-secondary [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="shrink-0 rounded-md px-3 py-2 transition-colors hover:bg-surface-2 hover:text-text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/#audit"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-text-secondary",
              )}
            >
              Audit trail
            </Link>
            <Link
              href="/#providers-card"
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            >
              Launch portal
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
