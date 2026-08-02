"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Mail, X } from "lucide-react";

import { cn } from "@/lib/utils";

type FilterUserEmailProps = {
  label?: string;
  suggestions: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
};

/**
 * Text input with autocomplete over event_log.user_email values.
 * Selecting a suggestion adds it to the active filter list (OR within key).
 */
export function FilterUserEmail({
  label = "User email",
  suggestions,
  selected,
  onChange,
  disabled,
  placeholder = "Search user email…",
}: FilterUserEmailProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = suggestions.filter((email) => !selectedSet.has(email));
    if (!q) return pool.slice(0, 12);
    return pool
      .filter((email) => email.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, suggestions, selectedSet]);

  // Keep highlight in range without a reset effect (avoids cascading renders).
  const safeHighlight =
    matches.length === 0 ? 0 : Math.min(highlight, matches.length - 1);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const addEmail = (email: string) => {
    const trimmed = email.trim();
    if (!trimmed || selectedSet.has(trimmed)) {
      setQuery("");
      setOpen(false);
      return;
    }
    onChange([...selected, trimmed]);
    setQuery("");
    setOpen(false);
  };

  const removeEmail = (email: string) => {
    onChange(selected.filter((v) => v !== email));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlight((h) =>
        Math.min(h + 1, Math.max(matches.length - 1, 0)),
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (open && matches[safeHighlight]) {
        addEmail(matches[safeHighlight]!);
        return;
      }
      if (query.trim()) {
        // Allow free-text email if it looks like an email, or matches a suggestion.
        const exact = suggestions.find(
          (s) => s.toLowerCase() === query.trim().toLowerCase(),
        );
        if (exact) {
          addEmail(exact);
          return;
        }
        if (query.includes("@")) {
          addEmail(query.trim());
        }
      }
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Backspace" && query === "" && selected.length > 0) {
      removeEmail(selected[selected.length - 1]!);
    }
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <p className="text-[12px] font-medium text-text-secondary">{label}</p>
      <div className="relative">
        <div
          className={cn(
            "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-border-visible bg-background px-2.5 py-1.5 transition-colors",
            "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40",
            disabled && "opacity-50",
          )}
        >
          <Mail className="size-3.5 shrink-0 text-text-tertiary" />
          {selected.map((email) => (
            <span
              key={email}
              className="inline-flex max-w-[200px] items-center gap-1 rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[11px] text-text-secondary"
            >
              <span className="truncate font-mono">{email}</span>
              <button
                type="button"
                disabled={disabled}
                aria-label={`Remove ${email}`}
                className="rounded p-0.5 text-text-tertiary hover:bg-surface-3 hover:text-text-primary"
                onClick={() => removeEmail(email)}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            disabled={disabled}
            value={query}
            placeholder={selected.length === 0 ? placeholder : "Add another…"}
            className="min-w-[140px] flex-1 bg-transparent text-[13px] text-text-primary outline-none placeholder:text-text-muted"
            onChange={(event) => {
              setQuery(event.target.value);
              setHighlight(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
          />
        </div>

        {open && matches.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-40 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-card"
          >
            {matches.map((email, index) => (
              <li
                key={email}
                role="option"
                aria-selected={index === safeHighlight}
              >
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center rounded-md px-2 py-1.5 text-left font-mono text-[12px] text-text-primary",
                    index === safeHighlight
                      ? "bg-accent-subtle text-accent"
                      : "hover:bg-surface-2",
                  )}
                  onMouseEnter={() => setHighlight(index)}
                  onMouseDown={(event) => {
                    // Prevent input blur before click applies.
                    event.preventDefault();
                    addEmail(email);
                  }}
                >
                  {email}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {open && query.trim() && matches.length === 0 ? (
          <div className="absolute z-40 mt-1 w-full rounded-md border border-border bg-popover px-3 py-2 text-[12px] text-text-secondary shadow-card">
            No matching emails
            {query.includes("@") ? (
              <button
                type="button"
                className="mt-1 block text-left font-medium text-accent hover:underline"
                onMouseDown={(event) => {
                  event.preventDefault();
                  addEmail(query.trim());
                }}
              >
                Use “{query.trim()}”
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
