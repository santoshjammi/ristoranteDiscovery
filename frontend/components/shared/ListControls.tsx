"use client";

import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import type { SortConfig, FilterConfig } from "@/lib/useList";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search..." }: SearchBarProps) {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 360 }}>
      <span style={{ position: "absolute", left: spacing.md, top: "50%", transform: "translateY(-50%)", fontSize: "0.875rem", color: colors.muted, pointerEvents: "none" }}>🔍</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: `${spacing.sm} ${spacing.md} ${spacing.sm} 2.25rem`,
          borderRadius: radius.md,
          border: `1px solid ${colors.border}`,
          background: colors.bg,
          color: colors.text,
          fontSize: "0.8125rem",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          style={{
            position: "absolute",
            right: spacing.sm,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: colors.muted,
            cursor: "pointer",
            fontSize: "0.75rem",
            padding: 0,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

interface SortButtonProps {
  label: string;
  sortKey: string;
  current: SortConfig;
  onToggle: (key: string) => void;
}

export function SortButton({ label, sortKey, current, onToggle }: SortButtonProps) {
  const active = current.key === sortKey;
  return (
    <button
      onClick={() => onToggle(sortKey)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: spacing.xs,
        padding: `${spacing.xs} ${spacing.md}`,
        borderRadius: radius.sm,
        border: `1px solid ${active ? colors.primary : colors.border}`,
        background: active ? colors.primaryLight : "transparent",
        color: active ? colors.primary : colors.muted,
        cursor: "pointer",
        fontSize: "0.75rem",
        fontWeight: active ? 600 : 400,
        whiteSpace: "nowrap",
      }}
    >
      {label}
      {active && <span style={{ fontSize: "0.625rem" }}>{current.direction === "asc" ? "↑" : "↓"}</span>}
    </button>
  );
}

interface FilterDropdownProps {
  label: string;
  filterKey: string;
  options: { value: string; label: string }[];
  current: FilterConfig[];
  onSet: (key: string, value: string) => void;
  onClear: (key: string) => void;
}

export function FilterDropdown({ label, filterKey, options, current, onSet, onClear }: FilterDropdownProps) {
  const activeFilter = current.find((f) => f.key === filterKey);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: spacing.xs }}>
      <span style={{ ...typography.caption, whiteSpace: "nowrap" }}>{label}:</span>
      <select
        value={activeFilter?.value || ""}
        onChange={(e) => {
          if (e.target.value) onSet(filterKey, e.target.value);
          else onClear(filterKey);
        }}
        style={{
          padding: `${spacing.xs} ${spacing.md}`,
          borderRadius: radius.sm,
          border: `1px solid ${activeFilter ? colors.primary : colors.border}`,
          background: activeFilter ? colors.primaryLight : colors.bg,
          color: colors.text,
          fontSize: "0.75rem",
          cursor: "pointer",
        }}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (n: number) => void;
}

export function Pagination({ page, totalPages, totalCount, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${spacing.md} 0` }}>
      <p style={{ ...typography.caption, margin: 0 }}>{totalCount} total</p>
      <div style={{ display: "flex", gap: spacing.xs, alignItems: "center" }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          style={{
            padding: `${spacing.xs} ${spacing.md}`,
            borderRadius: radius.sm,
            border: `1px solid ${colors.border}`,
            background: "transparent",
            color: page <= 1 ? colors.mutedDarker : colors.text,
            cursor: page <= 1 ? "not-allowed" : "pointer",
            fontSize: "0.75rem",
          }}
        >
          ← Prev
        </button>
        <span style={{ ...typography.caption, margin: `0 ${spacing.xs}` }}>
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          style={{
            padding: `${spacing.xs} ${spacing.md}`,
            borderRadius: radius.sm,
            border: `1px solid ${colors.border}`,
            background: "transparent",
            color: page >= totalPages ? colors.mutedDarker : colors.text,
            cursor: page >= totalPages ? "not-allowed" : "pointer",
            fontSize: "0.75rem",
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

interface ActiveFiltersProps {
  filters: FilterConfig[];
  onRemove: (key: string) => void;
  onClear: () => void;
}

export function ActiveFilters({ filters, onRemove, onClear }: ActiveFiltersProps) {
  if (filters.length === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" }}>
      {filters.map((f) => (
        <span
          key={f.key}
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.xs,
            padding: `${spacing.xs} ${spacing.md}`,
            borderRadius: radius.full,
            background: colors.primaryLight,
            color: colors.primary,
            fontSize: "0.75rem",
            fontWeight: 500,
          }}
        >
          {f.key}: {f.value}
          <button
            onClick={() => onRemove(f.key)}
            style={{
              background: "none",
              border: "none",
              color: colors.primary,
              cursor: "pointer",
              fontSize: "0.75rem",
              padding: 0,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </span>
      ))}
      <button
        onClick={onClear}
        style={{
          background: "none",
          border: "none",
          color: colors.muted,
          cursor: "pointer",
          fontSize: "0.75rem",
          textDecoration: "underline",
          padding: 0,
        }}
      >
        Clear all
      </button>
    </div>
  );
}
