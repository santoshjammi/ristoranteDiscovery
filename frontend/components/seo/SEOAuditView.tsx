"use client";

import type { SEOSchemaData, SEOIssueData } from "@/app/lib/discovery";

function severityColor(severity: string): string {
  const map: Record<string, string> = {
    critical: "var(--color-danger, #ef4444)",
    high: "var(--color-warning, #f59e0b)",
    medium: "var(--color-warning, #f59e0b)",
    low: "var(--color-muted, #6b7280)",
  };
  return map[severity] ?? map.low;
}

interface SEOAuditViewProps {
  coverage: number;
  completeness: number;
  schemaTypesPresent: string[];
  schemas: SEOSchemaData[];
  issues: SEOIssueData[];
}

export function SEOAuditView({
  coverage,
  completeness,
  schemaTypesPresent,
  schemas,
  issues,
}: SEOAuditViewProps) {
  const criticalIssues = issues.filter((i) => i.severity === "critical");
  const highIssues = issues.filter((i) => i.severity === "high");

  return (
    <div className="seo-audit-view" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 1.25rem",
          background: "var(--color-surface, #1e293b)",
          borderRadius: "0.75rem",
          border: "1px solid var(--color-border, #334155)",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>
            SEO Schema Audit
          </h3>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--color-muted, #94a3b8)" }}>
            {schemaTypesPresent.length}/4 schema types present
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>
            {issues.length} issue{issues.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Score Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem" }}>
        <ScoreCard label="Coverage" value={`${coverage}%`} color={coverage >= 100 ? "var(--color-success, #22c55e)" : "var(--color-warning, #f59e0b)"} />
        <ScoreCard label="Completeness" value={`${completeness}%`} color={completeness >= 80 ? "var(--color-success, #22c55e)" : "var(--color-warning, #f59e0b)"} />
        <ScoreCard label="Critical Issues" value={String(criticalIssues.length)} color={criticalIssues.length === 0 ? "var(--color-success, #22c55e)" : "var(--color-danger, #ef4444)"} />
        <ScoreCard label="High Issues" value={String(highIssues.length)} color={highIssues.length === 0 ? "var(--color-success, #22c55e)" : "var(--color-warning, #f59e0b)"} />
      </div>

      {/* Schema Types */}
      <div
        style={{
          padding: "1rem 1.25rem",
          background: "var(--color-surface, #1e293b)",
          borderRadius: "0.75rem",
          border: "1px solid var(--color-border, #334155)",
        }}
      >
        <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>
          Schema Types
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {schemas.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.5rem 0.75rem",
                background: "var(--color-bg, #0f172a)",
                borderRadius: "0.5rem",
                borderLeft: `3px solid ${s.isValid ? "var(--color-success, #22c55e)" : "var(--color-danger, #ef4444)"}`,
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text, #f1f5f9)" }}>
                  {s.type}
                </p>
                <p style={{ margin: "0.125rem 0 0", fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>
                  {s.isValid ? "Valid" : "Invalid"}
                </p>
              </div>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: s.coverageScore >= 80 ? "var(--color-success, #22c55e)" : "var(--color-warning, #f59e0b)" }}>
                {s.coverageScore}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div
          style={{
            padding: "1rem 1.25rem",
            background: "var(--color-surface, #1e293b)",
            borderRadius: "0.75rem",
            border: "1px solid var(--color-border, #334155)",
          }}
        >
          <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>
            Issues
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {issues.map((issue, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  background: "var(--color-bg, #0f172a)",
                  borderRadius: "0.5rem",
                  borderLeft: `3px solid ${severityColor(issue.severity)}`,
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text, #f1f5f9)" }}>
                    {issue.description}
                  </p>
                  <p style={{ margin: "0.125rem 0 0", fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>
                    {issue.schemaType} · {issue.field} · {issue.severity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Clear */}
      {issues.length === 0 && (
        <div
          style={{
            padding: "1rem 1.25rem",
            background: "var(--color-surface, #1e293b)",
            borderRadius: "0.75rem",
            border: "1px solid var(--color-border, #334155)",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-success, #22c55e)" }}>
            ✅ All schemas valid — no issues found
          </p>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        padding: "0.75rem 1rem",
        background: "var(--color-surface, #1e293b)",
        borderRadius: "0.5rem",
        border: "1px solid var(--color-border, #334155)",
        borderLeft: `3px solid ${color}`,
      }}
    >
      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </p>
      <p style={{ margin: "0.25rem 0 0", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text, #f1f5f9)" }}>
        {value}
      </p>
    </div>
  );
}
