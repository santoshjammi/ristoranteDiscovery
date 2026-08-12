"use client";

import { useState, useMemo, useCallback } from "react";

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export interface FilterConfig {
  key: string;
  value: string;
  type?: "exact" | "partial" | "range";
}

export interface ListOptions<T> {
  items: T[];
  searchFields?: (keyof T)[];
  defaultSort?: SortConfig;
  defaultFilters?: FilterConfig[];
  pageSize?: number;
}

export interface ListControls<T> {
  // Search
  search: string;
  setSearch: (v: string) => void;
  // Sort
  sort: SortConfig;
  setSort: (config: SortConfig) => void;
  toggleSort: (key: string) => void;
  // Filter
  filters: FilterConfig[];
  addFilter: (f: FilterConfig) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  setFilterValue: (key: string, value: string) => void;
  // Pagination
  page: number;
  setPage: (n: number) => void;
  totalPages: number;
  // Results
  filtered: T[];
  paged: T[];
  totalCount: number;
}

export function useList<T extends Record<string, any>>({
  items,
  searchFields = [],
  defaultSort = { key: "", direction: "asc" },
  defaultFilters = [],
  pageSize = 20,
}: ListOptions<T>): ListControls<T> {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortConfig>(defaultSort);
  const [filters, setFilters] = useState<FilterConfig[]>(defaultFilters);
  const [page, setPage] = useState(1);

  const toggleSort = useCallback((key: string) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const addFilter = useCallback((f: FilterConfig) => {
    setFilters((prev) => [...prev.filter((x) => x.key !== f.key), f]);
    setPage(1);
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFilters((prev) => prev.filter((f) => f.key !== key));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
    setPage(1);
  }, []);

  const setFilterValue = useCallback((key: string, value: string) => {
    setFilters((prev) => {
      const existing = prev.find((f) => f.key === key);
      if (!value) return prev.filter((f) => f.key !== key);
      if (existing) return prev.map((f) => (f.key === key ? { ...f, value } : f));
      return [...prev, { key, value }];
    });
    setPage(1);
  }, []);

  // Apply search
  const searched = useMemo(() => {
    if (!search.trim() || searchFields.length === 0) return items;
    const q = search.toLowerCase();
    return items.filter((item) =>
      searchFields.some((field) => {
        const val = item[field];
        if (val == null) return false;
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [items, search, searchFields]);

  // Apply filters
  const filtered = useMemo(() => {
    if (filters.length === 0) return searched;
    return searched.filter((item) =>
      filters.every((f) => {
        const val = item[f.key];
        if (val == null) return false;
        const s = String(val).toLowerCase();
        const fv = f.value.toLowerCase();
        return f.type === "exact" ? s === fv : s.includes(fv);
      })
    );
  }, [searched, filters]);

  // Apply sort
  const sorted = useMemo(() => {
    if (!sort.key) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      let cmp = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }
      return sort.direction === "asc" ? cmp : -cmp;
    });
  }, [filtered, sort]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize]
  );

  return {
    search,
    setSearch,
    sort,
    setSort,
    toggleSort,
    filters,
    addFilter,
    removeFilter,
    clearFilters,
    setFilterValue,
    page: safePage,
    setPage,
    totalPages,
    filtered: sorted,
    paged,
    totalCount: sorted.length,
  };
}
