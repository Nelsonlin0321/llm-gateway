"use client";

import { Check, ChevronsUpDown } from "lucide-react";

import { BuiltInProviderIcon } from "@/components/llm-providers/built-in-provider-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BuiltInProvider } from "@/lib/llm-provider/built-in";
import { cn } from "@/lib/utils";

type BuiltInProviderSelectProps = {
  providers: BuiltInProvider[];
  selected?: BuiltInProvider;
  disabled?: boolean;
  labelledBy?: string;
  onSelect: (provider: BuiltInProvider) => void;
};

export function BuiltInProviderSelect({
  providers,
  selected,
  disabled,
  labelledBy,
  onSelect,
}: BuiltInProviderSelectProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        aria-labelledby={labelledBy}
        className={cn(
          "inline-flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border-visible bg-transparent px-3 text-sm outline-none transition-[border-color,box-shadow]",
          "hover:bg-surface-2 focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-ring/40",
          "disabled:pointer-events-none disabled:opacity-50",
          "data-popup-open:border-accent data-popup-open:ring-3 data-popup-open:ring-ring/40",
          selected ? "text-foreground" : "text-text-tertiary",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected ? (
            <>
              <BuiltInProviderIcon key={selected.name} name={selected.name} />
              <span className="truncate font-medium text-foreground">
                {selected.name}
              </span>
            </>
          ) : (
            <span className="truncate">Select a built-in provider</span>
          )}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-text-tertiary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="z-70 max-h-72 min-w-(--anchor-width)"
      >
        {providers.map((provider) => (
          <DropdownMenuItem
            key={`${provider.apiFormat}:${provider.name}`}
            onClick={() => onSelect(provider)}
            className={cn(
              "items-start py-1.5",
              selected?.name === provider.name && "bg-accent/40",
            )}
          >
            <BuiltInProviderIcon
              key={provider.name}
              name={provider.name}
              className="mt-0.5"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{provider.name}</span>
              <span className="block truncate font-mono text-[11px] text-text-tertiary">
                {provider.apiUrl}
              </span>
            </span>
            {selected?.name === provider.name ? (
              <Check className="mt-0.5 size-3.5 shrink-0 text-accent" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
