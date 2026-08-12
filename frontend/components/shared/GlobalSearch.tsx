"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { colors, spacing, radius } from "@/lib/design-tokens";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8040";

interface SearchResult {
  id: string;
  type: "restaurant" | "recommendation" | "action";
  label: string;
  subtitle: string;
  href: string;
}

export function GlobalSearch({ token }: { token: string | null }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Cmd+K toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  // Search
  const doSearch = useCallback(async (q: string) => {
    if (!token || q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/restaurants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || data.restaurants || [];
      const ql = q.toLowerCase();
      const matches: SearchResult[] = [];
      for (const r of list) {
        if (r.name?.toLowerCase().includes(ql) || r.city?.toLowerCase().includes(ql)) {
          matches.push({
            id: r.id,
            type: "restaurant",
            label: r.name,
            subtitle: r.city || "",
            href: `/dashboard/restaurants/${r.id}`,
          });
        }
      }
      setResults(matches.slice(0, 5));
      setSelectedIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 200);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const navigate = (href: string) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      navigate(results[selectedIndex].href);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.sm,
          padding: `${spacing.sm} ${spacing.md}`,
          background: colors.bg,
          borderRadius: radius.md,
          border: `1px solid ${colors.border}`,
          cursor: "pointer",
          fontSize: "0.8125rem",
          color: colors.muted,
          width: "100%",
        }}
      >
        <span>🔍</span>
        <span style={{ flex: 1, textAlign: "left" }}>Search... (⌘K)</span>
      </button>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.sm,
          padding: `${spacing.sm} ${spacing.md}`,
          background: colors.bg,
          borderRadius: radius.md,
          border: `2px solid ${colors.primary}`,
        }}
      >
        <span>🔍</span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search restaurants..."
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            color: colors.text,
            fontSize: "0.8125rem",
            outline: "none",
          }}
        />
        <button
          onClick={() => setOpen(false)}
          style={{
            background: "none",
            border: "none",
            color: colors.muted,
            cursor: "pointer",
            fontSize: "0.75rem",
          }}
        >
          ESC
        </button>
      </div>

      {/* Results dropdown */}
      {query.length >= 2 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: spacing.xs,
            background: colors.surface,
            borderRadius: radius.md,
            border: `1px solid ${colors.border}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: spacing.lg, textAlign: "center", color: colors.muted, fontSize: "0.8125rem" }}>
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: spacing.lg, textAlign: "center", color: colors.muted, fontSize: "0.8125rem" }}>
              No results found
            </div>
          ) : (
            results.map((r, i) => (
              <button
                key={r.id}
                onClick={() => navigate(r.href)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.md,
                  padding: `${spacing.md} ${spacing.lg}`,
                  border: "none",
                  background: i === selectedIndex ? colors.primaryLight : "transparent",
                  color: colors.text,
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "0.8125rem",
                  borderBottom: i < results.length - 1 ? `1px solid ${colors.border}` : "none",
                }}
              >
                <span style={{ fontSize: "1rem" }}>{r.type === "restaurant" ? "🍽️" : r.type === "recommendation" ? "💡" : "✅"}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 500 }}>{r.label}</p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: colors.muted }}>{r.subtitle}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
