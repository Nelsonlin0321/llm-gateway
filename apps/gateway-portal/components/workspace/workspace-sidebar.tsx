"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Building2,
  CreditCard,
  KeyRound,
  LayoutGrid,
  PlugZap,
  ShieldCheck,
  UserRound,
  Waypoints,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { organization } from "@/lib/auth-client";
import {
  hasPermission,
  normalizeOrganizationRole,
  ORGANIZATION_ROLE_LABELS,
  type Entity,
} from "@/lib/organization/permissions";
import type { OrganizationListItem } from "@/lib/organization/service";
import { cn } from "@/lib/utils";

function organizationHref(organizationId: string | null, suffix = "") {
  const base = organizationId ? `/org/${organizationId}` : "/workspace";
  return `${base}${suffix}`;
}

function matchesOrganizationPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function buildConsoleNavigation(
  organizationId: string | null,
  role: string | null,
) {
  const overviewHref = organizationHref(organizationId);
  const providersHref = organizationHref(organizationId, "/providers");
  const modelsHref = organizationHref(organizationId, "/models");
  const childKeysHref = organizationHref(organizationId, "/child-keys");
  const analyticsHref = organizationHref(organizationId, "/analytics");

  const items: Array<{
    label: string;
    href: string;
    icon: typeof LayoutGrid;
    match: (pathname: string) => boolean;
    disabled?: boolean;
    entity?: Entity;
  }> = [
    {
      label: "Overview",
      href: overviewHref,
      icon: LayoutGrid,
      match: (pathname: string) =>
        pathname === "/workspace" || pathname === overviewHref,
    },
    {
      label: "Providers",
      href: providersHref,
      icon: PlugZap,
      match: (pathname: string) => matchesOrganizationPath(pathname, providersHref),
      entity: "llmProvider",
    },
    {
      label: "Models",
      href: modelsHref,
      icon: Boxes,
      match: (pathname: string) => matchesOrganizationPath(pathname, modelsHref),
      entity: "model",
    },
    {
      label: "Child Keys",
      href: childKeysHref,
      icon: KeyRound,
      match: (pathname: string) => matchesOrganizationPath(pathname, childKeysHref),
      entity: "childKey",
    },
    {
      label: "Guardrails",
      href: `${overviewHref}#guardrails`,
      icon: ShieldCheck,
      match: () => false,
      disabled: true,
    },
    {
      label: "Analytics",
      href: analyticsHref,
      icon: BarChart3,
      match: (pathname: string) => matchesOrganizationPath(pathname, analyticsHref),
    },
    {
      label: "Routing",
      href: `${overviewHref}#routing`,
      icon: Waypoints,
      match: () => false,
      disabled: true,
    },
  ];

  return items.filter(
    (item) => !item.entity || hasPermission(role, item.entity, "view"),
  );
}

const accountNavigation = [
  {
    label: "Organization",
    href: "/organization",
    icon: Building2,
    match: (pathname: string) =>
      pathname === "/organization" || pathname.startsWith("/organization/"),
  },
  {
    label: "Profile",
    href: "/profile/setting",
    icon: UserRound,
    match: (pathname: string) =>
      pathname === "/profile/setting" ||
      pathname.startsWith("/profile/setting/"),
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
  organizations: OrganizationListItem[];
  activeOrganizationId: string | null;
};

export function WorkspaceSidebar({
  userName,
  userEmail,
  organizations,
  activeOrganizationId,
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeOrganization =
    organizations.find((item) => item.id === activeOrganizationId) ??
    organizations[0];
  const consoleNavigation = buildConsoleNavigation(
    activeOrganization?.id ?? null,
    activeOrganization?.role ?? null,
  );

  useEffect(() => {
    if (activeOrganizationId || !activeOrganization) {
      return;
    }

    void organization
      .setActive({ organizationId: activeOrganization.id })
      .then(({ error }) => {
        if (!error) {
          router.refresh();
        }
      });
  }, [activeOrganization, activeOrganizationId, router]);

  const handleSwitch = async (organizationId: string) => {
    if (organizationId === activeOrganizationId) {
      return;
    }

    const { error } = await organization.setActive({ organizationId });
    if (!error) {
      if (pathname === "/workspace") {
        router.push(`/org/${organizationId}`);
        return;
      }

      if (pathname.startsWith("/org/")) {
        router.push(pathname.replace(/^\/org\/[^/]+/, `/org/${organizationId}`));
        return;
      }

      router.refresh();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-4 py-4">
        <p className="text-[10px] font-medium tracking-[0.14em] text-text-tertiary uppercase">
          Organization
        </p>
        <p className="mt-1.5 truncate text-sm font-semibold tracking-[-0.01em] text-sidebar-foreground">
          {activeOrganization?.name ?? "No organization"}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-text-tertiary">
          {userName || userEmail}
        </p>
        {activeOrganization ? (
          <Badge
            variant="neutral"
            className="mt-2"
          >
            {ORGANIZATION_ROLE_LABELS[normalizeOrganizationRole(activeOrganization.role)]}
          </Badge>
        ) : null}
        {organizations.length > 1 ? (
          <select
            aria-label="Switch organization"
            value={activeOrganization?.id ?? ""}
            onChange={(event) => {
              void handleSwitch(event.target.value);
            }}
            className="mt-3 h-8 w-full rounded-md border border-border-visible bg-transparent px-2 text-[12px] text-text-primary"
          >
            {organizations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
        <NavSection
          title="Console"
          items={consoleNavigation}
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
