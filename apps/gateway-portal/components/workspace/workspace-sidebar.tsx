"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ChevronRight,
  CreditCard,
  KeyRound,
  LayoutGrid,
  PlugZap,
  ShieldCheck,
  UserRound,
  Waypoints,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    label: "Analytics",
    href: "/workspace#analytics",
    icon: BarChart3,
    match: () => false,
  },
  {
    label: "Guardrails",
    href: "/workspace#guardrails",
    icon: ShieldCheck,
    match: () => false,
  },
  {
    label: "Child Keys",
    href: "/workspace/child-keys",
    icon: KeyRound,
    match: (pathname: string) => pathname.startsWith("/workspace/child-keys"),
  },
  {
    label: "Routing",
    href: "/workspace#routing",
    icon: Waypoints,
    match: () => false,
  },
] as const;

const accountNavigation = [
  {
    label: "Profile",
    href: "/workspace",
    icon: UserRound,
    match: () => false,
  },
  {
    label: "Billing",
    href: "/workspace#billing",
    icon: CreditCard,
    match: () => false,
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
    <Card className="border-border bg-surface-1">
      <CardHeader className="gap-4 border-b border-border">
        <div className="rounded-lg border border-border bg-background px-3 py-2.5">
          <p className="text-[11px] font-medium tracking-[0.12em] text-text-tertiary uppercase">
            Workspace
          </p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div>
              <p className="font-heading text-[0.95rem] font-semibold text-text-primary">
                Default Workspace
              </p>
              <p className="text-xs text-text-secondary">
                Personal environment
              </p>
            </div>
            <Badge variant="info">Active</Badge>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background px-3 py-2.5">
          <p className="text-[11px] font-medium tracking-[0.12em] text-text-tertiary uppercase">
            Signed in
          </p>
          <p className="mt-1 text-sm font-medium text-text-primary">
            {userName || "Workspace Admin"}
          </p>
          <p className="truncate text-xs text-text-secondary">{userEmail}</p>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 pt-5">
        <NavSection title="Workspace" items={workspaceNavigation} pathname={pathname} />
        <NavSection title="Account" items={accountNavigation} pathname={pathname} />
      </CardContent>
    </Card>
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
  }>;
  pathname: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium tracking-[0.12em] text-text-tertiary uppercase">
        {title}
      </p>
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.match(pathname);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-accent-subtle text-text-primary"
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
              <ChevronRight
                className={cn(
                  "size-4 transition-transform group-hover:translate-x-0.5",
                  isActive ? "text-accent" : "text-text-tertiary",
                )}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
