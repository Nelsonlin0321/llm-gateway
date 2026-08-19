"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { compatibilityTypes } from "@/lib/llm-provider/schema";
import {
  hasModelListFilters,
  type ModelListQuery,
  type ProviderSummary,
} from "@/lib/model/schema";
import { Button } from "@/components/ui/button";

const inputClassName =
  "h-10 w-full rounded-md border border-border-visible bg-transparent px-3 text-sm text-foreground transition-[border-color,box-shadow] placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-3 focus:ring-ring/40";

type ModelListFiltersProps = {
  query: ModelListQuery;
  providers: ProviderSummary[];
};

export function ModelListFilters({
  query,
  providers,
}: ModelListFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(query.q ?? "");

  const providerOptions = useMemo(() => {
    const nameCounts = new Map<string, number>();
    for (const provider of providers) {
      nameCounts.set(provider.name, (nameCounts.get(provider.name) ?? 0) + 1);
    }

    return [...providers]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((provider) => ({
        id: provider.id,
        label:
          (nameCounts.get(provider.name) ?? 0) > 1
            ? `${provider.name} (${provider.compatibilityType})`
            : provider.name,
      }));
  }, [providers]);

  const replaceQuery = (next: {
    provider?: string;
    compatibility?: string;
    q?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    const provider = next.provider ?? query.providerId ?? "";
    const compatibility =
      next.compatibility ?? query.compatibilityType ?? "";
    const q = (next.q ?? searchValue).trim();

    if (provider.length > 0) {
      params.set("provider", provider);
    } else {
      params.delete("provider");
    }

    if (compatibility === "openai" || compatibility === "anthropic") {
      params.set("compatibility", compatibility);
    } else {
      params.delete("compatibility");
    }

    if (q.length > 0) {
      params.set("q", q);
    } else {
      params.delete("q");
    }

    const href = params.size > 0 ? `${pathname}?${params}` : pathname;
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  };

  useEffect(() => {
    const trimmed = searchValue.trim();
    if (trimmed === (query.q ?? "")) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      replaceQuery({ q: trimmed });
    }, 300);

    return () => window.clearTimeout(timeoutId);
    // Replace is stable enough; we only want to debounce local input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, query.q]);

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
      onSubmit={(event) => {
        event.preventDefault();
        replaceQuery({ q: searchValue });
      }}
    >
      <label className="sr-only" htmlFor="model-provider-filter">
        Provider
      </label>
      <select
        id="model-provider-filter"
        value={query.providerId ?? ""}
        onChange={(event) => replaceQuery({ provider: event.target.value })}
        className={`${inputClassName} sm:w-48`}
      >
        <option value="">All providers</option>
        {providerOptions.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.label}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="model-compatibility-filter">
        API compatibility
      </label>
      <select
        id="model-compatibility-filter"
        value={query.compatibilityType ?? ""}
        onChange={(event) =>
          replaceQuery({ compatibility: event.target.value })
        }
        className={`${inputClassName} sm:w-48`}
      >
        <option value="">All compatibility</option>
        {compatibilityTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      <label className="relative min-w-0 flex-1 sm:min-w-56">
        <span className="sr-only">Search model name</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-text-tertiary" />
        <input
          id="model-name-search"
          type="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search model name"
          autoComplete="off"
          maxLength={64}
          className={`${inputClassName} pl-9`}
        />
      </label>

      {hasModelListFilters(query) ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 text-text-secondary"
          onClick={() => {
            setSearchValue("");
            replaceQuery({ provider: "", compatibility: "", q: "" });
          }}
        >
          <X className="size-3.5" />
          Clear
        </Button>
      ) : null}

      <span className="sr-only" aria-live="polite">
        {isPending ? "Updating models" : ""}
      </span>
    </form>
  );
}
