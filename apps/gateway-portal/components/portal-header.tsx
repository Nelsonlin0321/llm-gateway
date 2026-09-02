import Image from "next/image";
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
            aria-label="llm-gateway.io home"
            className="flex min-w-0 shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <Image
              src="/logo-without-text.jpg"
              alt=""
              width={28}
              height={28}
              className="size-7 rounded-md bg-white object-cover object-[center_36%] ring-1 ring-border"
              priority
            />
            <span className="hidden truncate font-heading text-sm font-semibold tracking-[-0.02em] text-text-primary sm:inline">
              llm-gateway.io
            </span>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-0.5 md:flex"
          >
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
          <Link
            href="https://github.com/Nelsonlin0321/llm-gateway"
            target="_blank"
            rel="noreferrer"
            aria-label="Open llm-gateway on GitHub"
            className="inline-flex size-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-5 fill-current"
            >
              <path d="M12 0.5C5.37 0.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.2 11.39 0.6 0.11 0.82-0.26 0.82-0.58 0-0.29-0.01-1.04-0.02-2.05-3.34 0.73-4.04-1.61-4.04-1.61-0.55-1.38-1.33-1.75-1.33-1.75-1.09-0.75 0.08-0.73 0.08-0.73 1.2 0.09 1.84 1.25 1.84 1.25 1.08 1.84 2.82 1.31 3.5 1 0.11-0.78 0.42-1.31 0.76-1.61-2.67-0.31-5.47-1.35-5.47-5.99 0-1.32 0.47-2.39 1.24-3.24-0.12-0.31-0.54-1.56 0.12-3.24 0 0 1.01-0.33 3.3 1.24a11.32 11.32 0 0 1 6 0c2.29-1.57 3.3-1.24 3.3-1.24 0.66 1.68 0.24 2.93 0.12 3.24 0.77 0.85 1.24 1.92 1.24 3.24 0 4.66-2.81 5.68-5.49 5.98 0.43 0.37 0.82 1.1 0.82 2.22 0 1.61-0.01 2.91-0.01 3.31 0 0.32 0.22 0.7 0.83 0.58A12 12 0 0 0 24 12.5C24 5.87 18.63 0.5 12 0.5Z" />
            </svg>
          </Link>
          <PortalHeaderAuth />
        </div>
      </div>
    </header>
  );
}
