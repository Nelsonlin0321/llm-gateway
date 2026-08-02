import Link from "next/link";

import { PortalHeaderAuth } from "@/components/portal-header-auth";

type PortalHeaderNavItem = {
  label: string;
  href: string;
};

type PortalHeaderProps = {
  navItems: readonly PortalHeaderNavItem[];
};

export function PortalHeader({ navItems }: PortalHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md">
      <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-accent text-[10px] font-bold tracking-tight text-accent-foreground">
              GW
            </span>
            <span className="hidden font-heading text-sm font-semibold tracking-[-0.02em] text-text-primary sm:inline">
              Gateway
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <PortalHeaderAuth />
        </div>
      </div>
    </header>
  );
}
