"use client";

import { colors, spacing, radius, typography } from "@/lib/design-tokens";

export interface TimelineEvent {
  id: string;
  date: string;
  groupLabel: string;
  title: string;
  description: string;
  kind: "score_change" | "evidence" | "decision" | "source";
  delta?: number;
}

const KIND_ICON: Record<TimelineEvent["kind"], string> = {
  score_change: "📈",
  evidence: "🔎",
  decision: "✅",
  source: "🔗",
};

function kindColor(kind: TimelineEvent["kind"], delta?: number): string {
  if (kind === "score_change") return delta !== undefined && delta > 0 ? colors.success : colors.danger;
  if (kind === "decision") return colors.primary;
  if (kind === "source") return colors.warning;
  return colors.muted;
}

export function EvidenceTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}` }}>
      <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.lg}` }}>Evidence Timeline</h3>
      {events.length === 0 ? (
        <p style={{ ...typography.small, margin: 0, color: colors.muted }}>No activity recorded yet. Connect a data source or run an analysis to see changes here.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.xl }}>
          {Array.from(groupByLabel(events).entries()).map(([label, items]) => (
            <div key={label}>
              <p style={{ ...typography.label, margin: `0 0 ${spacing.md}`, color: colors.mutedDarker, fontSize: "0.75rem", fontWeight: 700 }}>{label}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, borderLeft: `2px solid ${colors.border}`, paddingLeft: spacing.lg }}>
                {items.map((e) => (
                  <div key={e.id} style={{ display: "flex", gap: spacing.sm, alignItems: "flex-start" }}>
                    <span style={{ fontSize: "0.875rem" }}>{KIND_ICON[e.kind]}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: colors.text }}>{e.title}</p>
                      {e.description && <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{e.description}</p>}
                      {e.kind === "score_change" && e.delta !== undefined && (
                        <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: kindColor(e.kind, e.delta), fontWeight: 600 }}>
                          {e.delta > 0 ? `+${e.delta}` : e.delta} points
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function groupByLabel(events: TimelineEvent[]): Map<string, TimelineEvent[]> {
  const groups = new Map<string, TimelineEvent[]>();
  for (const e of events) {
    if (!groups.has(e.groupLabel)) groups.set(e.groupLabel, []);
    groups.get(e.groupLabel)!.push(e);
  }
  return groups;
}
