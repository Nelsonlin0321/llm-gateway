import Link from "next/link";
import { Command } from "lucide-react";

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
    <header className="rounded-[22px] border border-border bg-[color-mix(in_srgb,var(--surface-1)_80%,transparent)] p-2.5 shadow-card backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-[18px] border border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-accent-subtle text-accent">
            <Command className="size-4" />
          </div>
          <div className="space-y-1">
            <p className="[font-family:var(--font-display)] text-[1.05rem] font-semibold tracking-[-0.03em]">
              LLM Gateway Portal
            </p>
            <p className="text-[13px] text-text-secondary">
              Self-service governance for providers, pricing, keys, and
              analytics
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 text-sm text-text-secondary [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="shrink-0 rounded-lg px-3 py-2 transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/#audit"
              className={cn(
                buttonVariants({ variant: "ghost", size: "default" }),
                "px-4 text-sm text-text-secondary hover:bg-secondary hover:text-foreground",
              )}
            >
              View audit trail
            </Link>
            <Link
              href="/#providers-card"
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "px-4 text-sm font-semibold",
              )}
            >
              Launch portal
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
