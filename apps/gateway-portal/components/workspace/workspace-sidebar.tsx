"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  CreditCard,
  KeyRound,
  LayoutGrid,
  PlugZap,
  ShieldCheck,
  UserRound,
  Waypoints,
} from "lucide-react";

import { cn } from "@/lib/utils";

const workspaceNavigation = [
  {
    label: "Overview",
    href: "/workspace",
    icon: LayoutGrid,
    match: (pathname: string) => pathname === "/workspace",
  },
  {
    label: "Providers",
    href: "/workspace/providers",
    icon: PlugZap,
    match: (pathname: string) => pathname.startsWith("/workspace/providers"),
  },
  {
    label: "Models",
    href: "/workspace/providers",
    icon: Boxes,
    match: (pathname: string) =>
      /^\/workspace\/[^/]+\/models(?:\/|$)/.test(pathname),
  },
  {
    label: "Child Keys",
    href: "/workspace/child-keys",
    icon: KeyRound,
    match: (pathname: string) => pathname.startsWith("/workspace/child-keys"),
  },
  {
    label: "Guardrails",
    href: "/workspace#guardrails",
    icon: ShieldCheck,
    match: () => false,
    disabled: true,
  },
  {
    label: "Analytics",
    href: "/workspace#analytics",
    icon: BarChart3,
    match: () => false,
    disabled: true,
  },
  {
    label: "Routing",
    href: "/workspace#routing",
    icon: Waypoints,
    match: () => false,
    disabled: true,
  },
] as const;

const accountNavigation = [
  {
    label: "Profile",
    href: "/workspace",
    icon: UserRound,
    match: () => false,
    disabled: true,
  },
  {
    label: "Billing",
    href: "/workspace#billing",
    icon: CreditCard,
    match: () => false,
    disabled: true,
  },
] as const;

type WorkspaceSidebarProps = {
  userName?: string | null;
  userEmail: string;
};

export function WorkspaceSidebar({
  userName,
  userEmail,
}: WorkspaceSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-4 py-4">
        <p className="text-[10px] font-medium tracking-[0.14em] text-text-tertiary uppercase">
          Organization
        </p>
        <p className="mt-1.5 truncate text-sm font-semibold tracking-[-0.01em] text-sidebar-foreground">
          Default Workspace
        </p>
        <p className="mt-0.5 truncate text-[12px] text-text-tertiary">
          {userName || userEmail}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
        <NavSection
          title="Console"
          items={workspaceNavigation}
          pathname={pathname}
        />
        <NavSection
          title="Account"
          items={accountNavigation}
          pathname={pathname}
        />
      </div>

      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="truncate text-[11px] text-text-tertiary">{userEmail}</p>
      </div>
    </div>
  );
}

function NavSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: ReadonlyArray<{
    label: string;
    href: string;
    icon: typeof LayoutGrid;
    match: (pathname: string) => boolean;
    disabled?: boolean;
  }>;
  pathname: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="px-2 text-[10px] font-medium tracking-[0.14em] text-text-tertiary uppercase">
        {title}
      </p>
      <nav className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.match(pathname);
          const disabled = "disabled" in item && item.disabled;

          if (disabled) {
            return (
              <span
                key={item.label}
                className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-text-muted"
                title="Coming soon"
              >
                <Icon className="size-4 opacity-60" />
                <span className="flex-1">{item.label}</span>
                <span className="text-[10px] tracking-wide uppercase">Soon</span>
              </span>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
              )}
            >
              <Icon
                className={cn(
                  "size-4",
                  isActive ? "text-accent" : "text-text-tertiary",
                )}
              />
              <span className="flex-1">{item.label}</span>
              {isActive ? (
                <span className="size-1.5 rounded-full bg-accent" aria-hidden />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
