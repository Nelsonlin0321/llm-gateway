"use client";

import { ChevronsUpDown, X } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type FilterMultiSelectProps = {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
};

/**
 * Dropdown multi-select for discrete analytics filter values.
 */
export function FilterMultiSelect({
  label,
  options,
  selected,
  onChange,
  disabled,
  placeholder = "Any",
}: FilterMultiSelectProps) {
  const selectedSet = new Set(selected);
  const summary =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? selected[0]
        : `${selected.length} selected`;

  const toggle = (value: string) => {
    if (selectedSet.has(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-1.5">
      <p className="text-[12px] font-medium text-text-secondary">{label}</p>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled || options.length === 0}
          className={cn(
            "inline-flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border-visible bg-background px-3 text-[13px] outline-none transition-colors",
            "hover:bg-surface-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
            "disabled:pointer-events-none disabled:opacity-50",
            "data-popup-open:border-ring data-popup-open:ring-3 data-popup-open:ring-ring/40",
            selected.length === 0 ? "text-text-tertiary" : "text-text-primary",
          )}
        >
          <span className="truncate text-left font-normal">{summary}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-text-tertiary" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="min-w-(--anchor-width) max-w-80"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center justify-between gap-2">
              <span>{label}</span>
              {selected.length > 0 ? (
                <button
                  type="button"
                  className="text-[11px] font-medium text-accent hover:underline"
                  onClick={(event) => {
                    event.preventDefault();
                    onChange([]);
                  }}
                >
                  Clear
                </button>
              ) : null}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <div className="max-h-56 overflow-y-auto">
            {options.map((value) => (
              <DropdownMenuCheckboxItem
                key={value}
                checked={selectedSet.has(value)}
                onCheckedChange={() => toggle(value)}
                closeOnClick={false}
                className="pr-8 font-mono text-[12px]"
              >
                <span className="truncate">{value}</span>
              </DropdownMenuCheckboxItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {selected.length > 1 ? (
        <div className="flex flex-wrap gap-1">
          {selected.map((value) => (
            <span
              key={value}
              className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[11px] text-text-secondary"
            >
              <span className="truncate font-mono">{value}</span>
              <button
                type="button"
                disabled={disabled}
                aria-label={`Remove ${value}`}
                className="rounded p-0.5 text-text-tertiary hover:bg-surface-3 hover:text-text-primary"
                onClick={() => onChange(selected.filter((v) => v !== value))}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
