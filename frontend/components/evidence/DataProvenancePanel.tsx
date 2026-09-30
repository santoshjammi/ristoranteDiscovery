"use client";

import { useState } from "react";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import type { ProvenanceData } from "@/app/lib/discovery";

function confidenceColor(confidence: number): string {
  if (confidence >= 0.8) return colors.success;
  if (confidence >= 0.6) return colors.warning;
  return colors.danger;
}

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return "High";
  if (confidence >= 0.6) return "Medium";
  return "Low";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

function ProvenanceRow({ item }: { item: ProvenanceData["evidence"][number] }) {
  const [expanded, setExpanded] = useState(false);
  const color = confidenceColor(item.confidence);

  return (
    <div style={{ borderBottom: `1px solid ${colors.border}`, padding: `${spacing.md} 0` }}>
      <div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: colors.primary, fontWeight: 600, fontSize: "0.875rem", textDecoration: "none", wordBreak: "break-all" }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            {hostOf(item.sourceUrl)}
          </a>
          <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>
            {item.sourceTypeLabel} · observed {formatDate(item.observedAt)}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", fontSize: "0.75rem", flexShrink: 0 }}
        >
          {expanded ? "▾" : "▸"}
        </button>
      </div>
      {expanded && (
        <div style={{ marginTop: spacing.sm, paddingLeft: spacing.xl, display: "flex", flexDirection: "column", gap: spacing.xs }}>
          <div style={{ display: "flex", gap: spacing.sm, fontSize: "0.8125rem" }}>
            <span style={{ color: colors.mutedDarker, minWidth: "6rem" }}>Source URL</span>
            <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, wordBreak: "break-all", textDecoration: "none" }}>
              {item.sourceUrl}
            </a>
          </div>
          <div style={{ display: "flex", gap: spacing.sm, fontSize: "0.8125rem" }}>
            <span style={{ color: colors.mutedDarker, minWidth: "6rem" }}>Source type</span>
            <span style={{ color: colors.text }}>{item.sourceTypeLabel}</span>
          </div>
          <div style={{ display: "flex", gap: spacing.sm, fontSize: "0.8125rem" }}>
            <span style={{ color: colors.mutedDarker, minWidth: "6rem" }}>Observed</span>
            <span style={{ color: colors.text }}>{new Date(item.observedAt).toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", gap: spacing.sm, fontSize: "0.8125rem" }}>
            <span style={{ color: colors.mutedDarker, minWidth: "6rem" }}>Confidence</span>
            <span style={{ color }}>{confidenceLabel(item.confidence)} ({Math.round(item.confidence * 100)}%)</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function DataProvenancePanel({ data, loading }: { data: ProvenanceData | null; loading?: boolean }) {
  if (loading) {
    return (
      <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}` }}>
        <p style={{ ...typography.small, margin: 0, color: colors.muted }}>Loading data sources…</p>
      </div>
    );
  }

  if (!data) return null;

  const lastVerified = data.lastVerified ? formatDate(data.lastVerified) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
      {/* Real Data trust banner */}
      <div style={{ padding: spacing.lg, background: colors.successLight, borderRadius: radius.lg, border: `1px solid ${colors.success}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
          <span style={{ fontSize: "1rem" }}>✓</span>
          <span style={{ ...typography.body, fontWeight: 600, color: colors.success }}>Real data — no demo or sample data</span>
        </div>
        <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.textSecondary }}>
          Every score on this page is computed from live public sources (website, menu, reviews, Google Business Profile).
          {lastVerified ? ` Last verified ${lastVerified}.` : ""} Click any source below to verify it yourself.
        </p>
      </div>

      {/* Source-linked evidence */}
      <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
          <h3 style={{ ...typography.h3, margin: 0 }}>Data Sources ({data.count})</h3>
          <span style={{ ...typography.caption, color: colors.mutedDarker }}>
            {data.count > 0 ? `${data.count} real public sources` : "No sources yet"}
          </span>
        </div>
        {data.count === 0 ? (
          <p style={{ ...typography.small, margin: 0, color: colors.muted }}>
            No public sources have been observed for this restaurant yet. Connect a data source or run an analysis to collect real evidence.
          </p>
        ) : (
          <div>
            {data.evidence.map((item) => (
              <ProvenanceRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
