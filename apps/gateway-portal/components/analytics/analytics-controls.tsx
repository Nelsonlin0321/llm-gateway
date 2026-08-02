"use client";

import { CalendarRange, Filter, Layers3, X } from "lucide-react";

import { FilterMultiSelect } from "@/components/analytics/filter-multi-select";
import { FilterUserEmail } from "@/components/analytics/filter-user-email";
import { Button } from "@/components/ui/button";
import {
  ANALYTICS_METRICS,
  METRIC_LABELS,
  USER_EMAIL_FILTER_KEY,
  type AnalyticsDimensionOption,
  type AnalyticsFilterOption,
  type AnalyticsMetric,
  type DatePreset,
} from "@/lib/analytics/schema";
import { cn } from "@/lib/utils";

export type AnalyticsControlsState = {
  metric: AnalyticsMetric;
  dimension: string;
  datePreset: DatePreset;
  from: string;
  to: string;
  filters: Record<string, string[]>;
};

type AnalyticsControlsProps = {
  state: AnalyticsControlsState;
  dimensions: AnalyticsDimensionOption[];
  filterOptions: AnalyticsFilterOption[];
  onChange: (next: Partial<AnalyticsControlsState>) => void;
  isLoading?: boolean;
};

const DATE_PRESET_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom" },
];

export function AnalyticsControls({
  state,
  dimensions,
  filterOptions,
  onChange,
  isLoading,
}: AnalyticsControlsProps) {
  const multiSelectFilters = filterOptions.filter(
    (option) => option.kind === "multiSelect",
  );
  const userEmailFilter = filterOptions.find(
    (option) => option.kind === "userEmail",
  );

  const activeFilterCount = Object.values(state.filters).reduce(
    (sum, values) => sum + values.length,
    0,
  );

  const setFilterValues = (key: string, values: string[]) => {
    const nextFilters = { ...state.filters };
    if (values.length === 0) {
      delete nextFilters[key];
    } else {
      nextFilters[key] = values;
    }
    onChange({ filters: nextFilters });
  };

  const clearFilters = () => onChange({ filters: {} });

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-card">
      {/* Row 1: Metric + Dimension + Date */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr]">
        <ControlGroup label="Metric" hint="Y-axis">
          <div className="flex flex-wrap gap-1.5">
            {ANALYTICS_METRICS.map((metric) => (
              <Chip
                key={metric}
                active={state.metric === metric}
                onClick={() => onChange({ metric })}
                disabled={isLoading}
              >
                {METRIC_LABELS[metric]}
              </Chip>
            ))}
          </div>
        </ControlGroup>

        <ControlGroup label="Dimension" hint="Stack segments" icon={Layers3}>
          <select
            value={state.dimension}
            disabled={isLoading || dimensions.length === 0}
            onChange={(event) => onChange({ dimension: event.target.value })}
            className={selectClassName}
          >
            {dimensions.length === 0 ? (
              <option value={state.dimension}>Provider</option>
            ) : (
              dimensions.map((dim) => (
                <option key={dim.value} value={dim.value}>
                  {dim.label}
                  {dim.source !== "builtin" ? ` · ${dim.source}` : ""}
                </option>
              ))
            )}
          </select>
        </ControlGroup>

        <ControlGroup label="Date range" hint="X-axis" icon={CalendarRange}>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {DATE_PRESET_OPTIONS.map((preset) => (
                <Chip
                  key={preset.value}
                  active={state.datePreset === preset.value}
                  onClick={() => onChange({ datePreset: preset.value })}
                  disabled={isLoading}
                >
                  {preset.label}
                </Chip>
              ))}
            </div>
            {state.datePreset === "custom" ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={state.from}
                  disabled={isLoading}
                  onChange={(event) => onChange({ from: event.target.value })}
                  className={inputClassName}
                />
                <span className="text-[12px] text-text-tertiary">to</span>
                <input
                  type="date"
                  value={state.to}
                  disabled={isLoading}
                  onChange={(event) => onChange({ to: event.target.value })}
                  className={inputClassName}
                />
              </div>
            ) : null}
          </div>
        </ControlGroup>
      </div>

      {/* Row 2: Filters */}
      <div className="border-t border-border pt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="size-3.5 text-text-tertiary" />
            <p className="text-[11px] font-medium tracking-[0.08em] text-text-tertiary uppercase">
              Filters
            </p>
            {activeFilterCount > 0 ? (
              <span className="rounded-sm bg-accent-subtle px-1.5 py-0.5 text-[11px] font-medium text-accent tabular-nums">
                {activeFilterCount}
              </span>
            ) : null}
          </div>
          {activeFilterCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={clearFilters}
              disabled={isLoading}
            >
              <X className="size-3" />
              Clear
            </Button>
          ) : null}
        </div>

        {multiSelectFilters.length === 0 && !userEmailFilter ? (
          <p className="text-[13px] text-text-secondary">
            No filterable fields in the current data window.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {multiSelectFilters.map((option) => (
              <FilterMultiSelect
                key={option.key}
                label={option.label}
                options={option.values}
                selected={state.filters[option.key] ?? []}
                onChange={(values) => setFilterValues(option.key, values)}
                disabled={isLoading}
              />
            ))}

            {userEmailFilter ? (
              <div className="sm:col-span-2 xl:col-span-1">
                <FilterUserEmail
                  label={userEmailFilter.label}
                  suggestions={userEmailFilter.values}
                  selected={
                    state.filters[USER_EMAIL_FILTER_KEY] ??
                    state.filters[userEmailFilter.key] ??
                    []
                  }
                  onChange={(values) =>
                    setFilterValues(USER_EMAIL_FILTER_KEY, values)
                  }
                  disabled={isLoading}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function ControlGroup({
  label,
  hint,
  icon: Icon,
  children,
}: {
  label: string;
  hint?: string;
  icon?: typeof Layers3;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        {Icon ? <Icon className="size-3.5 text-text-tertiary" /> : null}
        <p className="text-[11px] font-medium tracking-[0.08em] text-text-tertiary uppercase">
          {label}
        </p>
        {hint ? (
          <span className="text-[11px] text-text-muted">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
  disabled,
  size = "md",
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-md border font-medium transition-colors disabled:opacity-50",
        size === "sm"
          ? "px-2 py-0.5 text-[11px]"
          : "px-2.5 py-1 text-[12px]",
        active
          ? "border-accent/40 bg-accent-subtle text-accent"
          : "border-border bg-surface-2 text-text-secondary hover:border-border-strong hover:text-text-primary",
      )}
    >
      {children}
    </button>
  );
}

const selectClassName =
  "h-9 w-full rounded-md border border-border-visible bg-background px-3 text-[13px] text-text-primary outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50";

const inputClassName =
  "h-8 rounded-md border border-border-visible bg-background px-2.5 text-[12px] text-text-primary tabular-nums outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50";
