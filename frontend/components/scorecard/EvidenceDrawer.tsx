"use client";

import { useCallback, useEffect, useRef } from "react";
import { colors, radius, spacing, typography } from "@/lib/design-tokens";
import { confidencePercent } from "./SignalRow";

// ── Reusable EvidenceDrawer (spec §23) ──
// Clicking a signal's evidence opens this drawer showing the Observation
// description, Source, Observed-at date, Confidence, and Methodology.
// Dismissible (✕ / overlay / Esc) and full-width usable on mobile.

/** Minimal shape — every field optional so it degrades gracefully. */
export interface EvidenceDrawerData {
  label?: string;
  description?: string;
  sourceName?: string;
  sourceType?: string;
  observedAt?: string;
  confidence?: number;
  methodologyVersion?: string;
  /** Evidence reference list surfaced as source/provenance lines. */
  evidenceRefs?: string[];
}

function formatObserved(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function sourceLabel(sourceType?: string, sourceName?: string): string {
  if (sourceName) return sourceName;
  if (!sourceType) return "—";
  return sourceType.replace(/_/g, " ");
}

export function EvidenceDrawer({
  data,
  onClose,
}: {
  data: EvidenceDrawerData | null;
  onClose: () => void;
}) {
  const drawerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!data) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [data, close]);

  if (!data) return null;

  const conf = confidencePercent(data.confidence);
  const obs = formatObserved(data.observedAt);
  const refs = data.evidenceRefs ?? [];

  const renderRow = (k: string, v: React.ReactNode) => (
    <div style={{ marginBottom: spacing.lg }}>
      <p style={{ ...typography.label, margin: `0 0 ${spacing.xs}`, color: colors.mutedDarker }}>
        {k}
      </p>
      {v}
    </div>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={data.label ? `${data.label} evidence` : "Evidence"}
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(4, 8, 16, 0.6)",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "stretch",
      }}
    >
      <div
        ref={drawerRef}
        role="document"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(480px, 100%)",
          maxWidth: "100%",
          height: "100%",
          background: colors.surface,
          borderLeft: `1px solid ${colors.border}`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
          padding: spacing.xl,
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: spacing.lg,
          }}
        >
          <div>
            <p style={{ ...typography.label, margin: `0 0 ${spacing.xs}`, color: colors.mutedDarker }}>
              Evidence
            </p>
            <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: colors.text }}>
              {data.label || "Signal"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close evidence"
            onClick={close}
            style={{
              border: "none", background: "transparent", color: colors.mutedDarker,
              cursor: "pointer", fontSize: "1.125rem", padding: spacing.xs, lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {data.description ? (
          renderRow("Observation", <p style={{ ...typography.body, margin: 0, fontSize: "0.875rem" }}>{data.description}</p>)
        ) : (
          renderRow("Observation", <p style={{ ...typography.small, margin: 0, fontStyle: "italic" }}>No observation description available.</p>)
        )}

        {renderRow("Source", (
          <p style={{ ...typography.small, margin: 0, fontWeight: 600 }}>
            {sourceLabel(data.sourceType, data.sourceName)}
          </p>
        ))}

        {renderRow("Observed", (
          <p style={{ ...typography.small, margin: 0 }}>{obs}</p>
        ))}

        {renderRow("Confidence", (
          <span
            style={{
              display: "inline-block", padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: radius.sm, fontSize: "0.75rem", fontWeight: 600,
              background: colors.primaryLight, color: colors.primary,
            }}
          >
            {conf !== null ? `${conf}%` : "—"}
          </span>
        ))}

        {renderRow("Methodology", (
          <p style={{ ...typography.small, margin: 0 }}>
            {data.methodologyVersion || "—"}
          </p>
        ))}

        {refs.length > 0 && (
          <>
            <p style={{ ...typography.label, margin: `${spacing.sm} 0 ${spacing.xs}`, color: colors.mutedDarker }}>
              Evidence Sources
            </p>
            <ul style={{ margin: 0, paddingLeft: spacing.lg, fontSize: "0.6875rem", color: colors.muted }}>
              {refs.map((r, i) => (
                <li key={i} style={{ marginBottom: spacing.xs }}>{r}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
