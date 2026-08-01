"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut } from "lucide-react";
import toast from "react-hot-toast";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function UserAvatar({
  name,
  email,
  image,
  label,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  label: string;
}) {
  const initials = getInitials(name, email);

  if (image) {
    // User image URLs may be external (OAuth/provider hosts).
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img src={image} alt={label} className="size-full object-cover" />
    );
  }

  return (
    <span className="flex size-full items-center justify-center bg-surface-3 text-[11px] font-semibold tracking-tight text-text-primary">
      {initials}
    </span>
  );
}

export function PortalHeaderAuth() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

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

    const handleSignOut = async () => {
      if (isSigningOut) {
        return;
      }

      setIsSigningOut(true);
      try {
        await signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push("/sign-in");
              router.refresh();
            },
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to sign out.";
        toast.error(message);
        setIsSigningOut(false);
      }
    };

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

        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex size-8 shrink-0 overflow-hidden rounded-full border border-border bg-surface-2 transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring data-popup-open:ring-2 data-popup-open:ring-ring"
            aria-label={`${label} menu`}
            title={label}
          >
            <UserAvatar
              name={user.name}
              email={user.email}
              image={user.image}
              label={label}
            />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" sideOffset={8} className="min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-1.5 font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="truncate text-sm font-medium text-text-primary">
                    {user.name || "Account"}
                  </span>
                  {user.email ? (
                    <span className="truncate text-xs text-text-tertiary">
                      {user.email}
                    </span>
                  ) : null}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onClick={() => {
                  router.push("/workspace");
                }}
              >
                <LayoutDashboard className="size-4" />
                Workspace
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer gap-2"
                disabled={isSigningOut}
                onClick={() => {
                  void handleSignOut();
                }}
              >
                <LogOut className="size-4" />
                {isSigningOut ? "Signing out..." : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
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
