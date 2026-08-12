"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/lib/auth-context";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8040";

export default function WeeklySummary({ restaurantId }: { restaurantId: string }) {
  const { token } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/restaurants/${restaurantId}/summary`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setSummary(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, restaurantId]);

  if (loading) return <p style={{ color: "var(--color-muted, #94a3b8)", fontSize: "0.875rem" }}>Loading summary...</p>;
  if (!summary) return <p style={{ color: "var(--color-muted, #94a3b8)", fontSize: "0.875rem" }}>No summary available yet.</p>;

  return (
    <div style={{ padding: "1.25rem", background: "var(--color-surface, #1e293b)", borderRadius: "0.75rem", border: "1px solid var(--color-border, #334155)" }}>
      <h3 style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>Weekly Summary</h3>
      <p style={{ margin: "0 0 1rem", fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>
        {new Date(summary.period.start).toLocaleDateString()} — {new Date(summary.period.end).toLocaleDateString()}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
        <div style={{ padding: "0.75rem", background: "var(--color-bg, #0f172a)", borderRadius: "0.375rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text, #f1f5f9)" }}>{summary.stats.totalDecisions}</p>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>Decisions</p>
        </div>
        <div style={{ padding: "0.75rem", background: "var(--color-bg, #0f172a)", borderRadius: "0.375rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--color-success, #22c55e)" }}>{summary.improvements}</p>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>Completed</p>
        </div>
        <div style={{ padding: "0.75rem", background: "var(--color-bg, #0f172a)", borderRadius: "0.375rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: summary.newDecisions > 0 ? "var(--color-primary, #3b82f6)" : "var(--color-muted, #94a3b8)" }}>{summary.newDecisions}</p>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>New</p>
        </div>
      </div>

      {summary.risks.length > 0 && (
        <div style={{ padding: "0.5rem 0.75rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "0.375rem", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-danger, #ef4444)" }}>{summary.risks[0]}</p>
        </div>
      )}

      {summary.lastAnalysis && (
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>
          Last analysis: {new Date(summary.lastAnalysis).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
