"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function PortalHeaderAuth() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div
        className="size-8 animate-pulse rounded-full bg-surface-2"
        aria-hidden
      />
    );
  }

  if (session?.user) {
    const user = session.user;
    const label = user.name || user.email || "Account";
    const initials = getInitials(user.name, user.email);

    return (
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="max-w-[10rem] truncate text-[13px] font-medium text-text-primary">
            {user.name || "Account"}
          </p>
          <p className="max-w-[10rem] truncate text-[11px] text-text-tertiary">
            {user.email}
          </p>
        </div>
        <Link
          href="/workspace"
          className="inline-flex size-8 shrink-0 overflow-hidden rounded-full border border-border bg-surface-2 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={label}
          title={label}
        >
          {user.image ? (
            // User image URLs may be external (OAuth/provider hosts).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={label}
              className="size-full object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center bg-surface-3 text-[11px] font-semibold tracking-tight text-text-primary">
              {initials}
            </span>
          )}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/sign-in"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "text-[13px]",
        )}
      >
        Sign in
      </Link>
      <Link
        href="/workspace"
        className={cn(
          buttonVariants({ variant: "default", size: "sm" }),
          "text-[13px]",
        )}
      >
        Open console
      </Link>
    </div>
  );
}
