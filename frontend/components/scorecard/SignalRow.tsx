"use client";

import { colors, radius, spacing, typography } from "@/lib/design-tokens";

// ── Reusable customer-facing SignalRow (spec §22) ──
// Shows: status icon, label, observed value, signal score, confidence,
// evidence count. NO technical weights are shown to customers.
// Renders a muted "Pending"-style row for pending/stale/not_applicable
// signals without fabricating a number.

export type SignalStatus =
  | "measured"
  | "partial"
  | "pending_observation"
  | "not_applicable"
  | "stale";

/** Minimal shape the row needs. Everything is optional so it degrades. */
export interface SignalRowItem {
  id?: string;
  label: string;
  description?: string;
  status: SignalStatus;
  rawValue?: unknown;
  normalizedValue?: number;
  confidence?: number;
  /** Evidence reference list (evidence count = its length). */
  evidenceRefs?: string[];
}

export function signalStatusLabel(status: SignalStatus): string {
  switch (status) {
    case "measured": return "Measured";
    case "partial": return "Partial";
    case "pending_observation": return "Pending Observation";
    case "not_applicable": return "Not Applicable";
    case "stale": return "Stale";
  }
}

export function signalStatusIcon(status: SignalStatus): string {
  switch (status) {
    case "measured": return "✓";
    case "partial": return "⚠";
    case "pending_observation":
    case "not_applicable":
    case "stale": return "○";
  }
}

/** Normalize a 0..1 (or already-0..100) confidence to a 0..100 integer. */
export function confidencePercent(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (value > 1) return Math.round(value);
  return Math.round(value * 100);
}

/** Frozen score-color mapping (spec §27) — no new hardcoded colors. */
export function signalStatusColor(status: SignalStatus): string {
  switch (status) {
    case "measured": return colors.success;
    case "partial": return colors.warning;
    case "pending_observation":
    case "not_applicable":
    case "stale": return colors.mutedDarker;
  }
}

/** Human-readable form of a signal's observed value (degrades gracefully). */
export function formatSignalValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") {
    if (Number.isInteger(v)) return String(v);
    return String(Math.round(v * 100) / 100);
  }
  if (typeof v === "string") return v;
  return String(v);
}

function isPending(status: SignalStatus): boolean {
  return status === "pending_observation" || status === "not_applicable" || status === "stale";
}

export function SignalRow({
  signal,
  onEvidenceClick,
}: {
  signal: SignalRowItem;
  onEvidenceClick?: () => void;
}) {
  const evidenceCount = signal.evidenceRefs?.length ?? 0;
  const pending = isPending(signal.status);
  const conf = confidencePercent(signal.confidence);

  // Pending / stale / not_applicable → muted row, NO fabricated score.
  if (pending) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.sm,
          padding: `${spacing.sm} ${spacing.md}`,
          background: colors.bg,
          borderRadius: radius.md,
          opacity: 0.7,
        }}
      >
        <span
          style={{
            width: "1.1rem", flexShrink: 0, textAlign: "center",
            color: signalStatusColor(signal.status), fontSize: "0.8125rem", fontWeight: 700,
          }}
        >
          {signalStatusIcon(signal.status)}
        </span>
        <p style={{ flex: 1, margin: 0, fontSize: "0.75rem", fontWeight: 600, color: colors.text }}>
          {signal.label}
        </p>
        <span
          style={{
            padding: `${spacing.xs} ${spacing.sm}`, borderRadius: radius.sm,
            fontSize: "0.625rem", fontWeight: 600,
            background: colors.border, color: colors.mutedDarker, whiteSpace: "nowrap",
          }}
        >
          {signalStatusLabel(signal.status)}
        </span>
      </div>
    );
  }

  // Measured / partial → icon + label + value + score + confidence + evidence.
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: spacing.sm,
        flexWrap: "wrap",
        padding: `${spacing.sm} ${spacing.md}`,
        background: colors.bg,
        borderRadius: radius.md,
      }}
    >
      <span
        style={{
          width: "1.1rem", flexShrink: 0, textAlign: "center",
          color: signalStatusColor(signal.status), fontSize: "0.8125rem", fontWeight: 700,
        }}
      >
        {signalStatusIcon(signal.status)}
      </span>
      <div style={{ flex: 1, minWidth: 120 }}>
        <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, color: colors.text }}>
          {signal.label}
        </p>
        {signal.description && (
          <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>
            {signal.description}
          </p>
        )}
      </div>
      <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: colors.muted, whiteSpace: "nowrap" }}>
        {formatSignalValue(signal.rawValue)}
      </span>
      <span
        style={{
          fontSize: "0.8125rem", fontWeight: 700, minWidth: "2rem", textAlign: "right",
          color: signal.normalizedValue !== undefined && signal.normalizedValue !== null
            ? signalStatusColor(signal.status)
            : colors.mutedDarker,
        }}
      >
        {signal.normalizedValue !== undefined && signal.normalizedValue !== null
          ? signal.normalizedValue
          : "—"}
      </span>
      {/* Confidence: text + color pair (not color alone — spec §27) */}
      {conf !== null ? (
        <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: colors.primary, whiteSpace: "nowrap" }}>
          {conf}% conf
        </span>
      ) : (
        <span style={{ ...typography.caption, whiteSpace: "nowrap", color: colors.mutedDarker }}>—</span>
      )}
      {evidenceCount > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEvidenceClick?.(); }}
          style={{
            padding: `${spacing.xs} ${spacing.sm}`, borderRadius: radius.sm,
            fontSize: "0.625rem", fontWeight: 600, cursor: "pointer",
            border: `1px solid ${colors.borderLight}`,
            background: "transparent", color: colors.primary, whiteSpace: "nowrap",
          }}
        >
          {evidenceCount} evidence
        </button>
      )}
    </div>
  );
}
