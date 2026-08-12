"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { runAudit, type AuditReport } from "@/app/lib/api";

function severityColor(s: string): string {
  const map: Record<string, string> = { critical: "#ef4444", high: "#f59e0b", medium: "#3b82f6", low: "#6b7280" };
  return map[s] || "#6b7280";
}

function severityLabel(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function categoryIcon(c: string): string {
  const map: Record<string, string> = { menu: "🍽️", reviews: "⭐", seo: "🔍", competitive: "🏆", market: "📊", discoverability: "📈" };
  return map[c] || "📌";
}

function scoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function AuditReportView() {
  const { token } = useAuth();
  const params = useParams();
  const restaurantId = params?.id as string;
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !restaurantId) return;
    setLoading(true);
    runAudit(restaurantId, token)
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, restaurantId]);

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", padding: "4rem 0" }}>
        <p style={{ fontSize: "1.25rem", color: "var(--color-muted, #94a3b8)" }}>Running your visibility audit...</p>
        <p style={{ fontSize: "0.875rem", color: "var(--color-muted, #94a3b8)", marginTop: "0.5rem" }}>
          Analyzing menu, reviews, SEO, competitors, and market position.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", padding: "4rem 0" }}>
        <p style={{ color: "#ef4444", fontSize: "1rem" }}>{error}</p>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text, #f1f5f9)" }}>
          Visibility Audit
        </h1>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted, #94a3b8)" }}>
          {report.restaurantName} · Generated {new Date(report.generatedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Overall Score */}
      <div style={{
        padding: "2rem", background: "var(--color-surface, #1e293b)", borderRadius: "0.75rem",
        border: "1px solid var(--color-border, #334155)", marginBottom: "1.5rem", textAlign: "center"
      }}>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Overall Visibility Score
        </p>
        <p style={{ margin: 0, fontSize: "3.5rem", fontWeight: 700, color: scoreColor(report.overallScore) }}>
          {report.overallScore}
        </p>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "var(--color-muted, #94a3b8)" }}>
          {report.overallScore >= 70 ? "Good visibility. Targeted improvements will help." :
           report.overallScore >= 40 ? "Moderate visibility. Several issues need attention." :
           "Low visibility. Significant improvements needed."}
        </p>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div style={{ padding: "1rem", background: "var(--color-surface, #1e293b)", borderRadius: "0.75rem", border: "1px solid var(--color-border, #334155)" }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Strengths</p>
          {report.summary.strengths.length > 0 ? report.summary.strengths.map((s, i) => (
            <p key={i} style={{ margin: "0 0 0.25rem", fontSize: "0.8125rem", color: "var(--color-text, #f1f5f9)" }}>✅ {s}</p>
          )) : <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-muted, #94a3b8)" }}>No strengths identified yet</p>}
        </div>
        <div style={{ padding: "1rem", background: "var(--color-surface, #1e293b)", borderRadius: "0.75rem", border: "1px solid var(--color-border, #334155)" }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Weaknesses</p>
          {report.summary.weaknesses.length > 0 ? report.summary.weaknesses.map((s, i) => (
            <p key={i} style={{ margin: "0 0 0.25rem", fontSize: "0.8125rem", color: "var(--color-text, #f1f5f9)" }}>⚠️ {s}</p>
          )) : <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-muted, #94a3b8)" }}>No critical issues</p>}
        </div>
        <div style={{ padding: "1rem", background: "var(--color-surface, #1e293b)", borderRadius: "0.75rem", border: "1px solid var(--color-border, #334155)" }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Quick Wins</p>
          {report.summary.quickWins.length > 0 ? report.summary.quickWins.map((s, i) => (
            <p key={i} style={{ margin: "0 0 0.25rem", fontSize: "0.8125rem", color: "var(--color-text, #f1f5f9)" }}>⚡ {s}</p>
          )) : <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-muted, #94a3b8)" }}>No quick wins identified</p>}
        </div>
      </div>

      {/* Top 5 Issues */}
      <h2 style={{ margin: "0 0 1rem", fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>
        Top Issues
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
        {report.topIssues.map((issue, i) => (
          <div key={i} style={{
            padding: "1.25rem", background: "var(--color-surface, #1e293b)", borderRadius: "0.75rem",
            border: `1px solid ${severityColor(issue.severity)}40`,
            borderLeft: `4px solid ${severityColor(issue.severity)}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.25rem" }}>{categoryIcon(issue.category)}</span>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>
                  {issue.title}
                </h3>
              </div>
              <span style={{
                padding: "0.125rem 0.5rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600,
                background: `${severityColor(issue.severity)}20`, color: severityColor(issue.severity),
              }}>
                {severityLabel(issue.severity)}
              </span>
            </div>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.875rem", color: "var(--color-muted, #94a3b8)", lineHeight: 1.5 }}>
              {issue.description}
            </p>
            <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>
              <span>🎯 {issue.impact}</span>
              <span>📎 {issue.evidence}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Score Breakdown */}
      <h2 style={{ margin: "0 0 1rem", fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>
        Score Breakdown
      </h2>
      <div style={{ padding: "1.25rem", background: "var(--color-surface, #1e293b)", borderRadius: "0.75rem", border: "1px solid var(--color-border, #334155)", marginBottom: "2rem" }}>
        {Object.entries(report.scores).map(([key, value]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.5rem 0", borderBottom: "1px solid var(--color-border, #334155)" }}>
            <span style={{ minWidth: "12rem", fontSize: "0.8125rem", color: "var(--color-text, #f1f5f9)", fontWeight: 500 }}>
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
            </span>
            <div style={{ flex: 1, height: "0.5rem", background: "var(--color-bg, #0f172a)", borderRadius: "9999px", overflow: "hidden" }}>
              <div style={{ width: `${value}%`, height: "100%", background: scoreColor(value), borderRadius: "9999px" }} />
            </div>
            <span style={{ minWidth: "2.5rem", textAlign: "right", fontSize: "0.875rem", fontWeight: 600, color: scoreColor(value) }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{
        padding: "2rem", background: "linear-gradient(135deg, #1e293b, #0f172a)", borderRadius: "0.75rem",
        border: "1px solid var(--color-border, #334155)", textAlign: "center", marginBottom: "2rem"
      }}>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.125rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>
          Want to track these issues and get weekly updates?
        </h3>
        <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "var(--color-muted, #94a3b8)" }}>
          Subscribe to get continuous monitoring, prioritized recommendations, and measurable improvement tracking.
        </p>
        <a href="/dashboard/settings" style={{
          padding: "0.75rem 2rem", borderRadius: "0.5rem", border: "none",
          background: "var(--color-primary, #3b82f6)", color: "#fff", fontWeight: 600,
          fontSize: "1rem", cursor: "pointer", textDecoration: "none", display: "inline-block",
        }}>
          View Subscription Plans
        </a>
      </div>
    </div>
  );
}

export default function AuditReportPage() {
  return <AuthProvider><AuditReportView /></AuthProvider>;
}
