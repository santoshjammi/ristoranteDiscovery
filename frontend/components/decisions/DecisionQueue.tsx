"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/lib/auth-context";

import { API } from "@/app/lib/api-config";

interface Decision {
  id: string;
  title: string;
  priority: number;
  confidence: number;
  businessImpact: string;
  effort: string;
  category: string;
  observation: string;
  evidence: string;
  reasoning: string;
  actionSteps: string;
  status: string;
  createdAt: string;
}

interface DecisionStats {
  total: number;
  accepted: number;
  completed: number;
  dismissed: number;
  acceptanceRate: number;
}

interface DecisionCardProps {
  decision: Decision;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  onComplete: (id: string) => void;
}

function DecisionCard({ decision, onAccept, onDismiss, onComplete }: DecisionCardProps) {
  const evidence = JSON.parse(decision.evidence || "[]");
  const reasoning = JSON.parse(decision.reasoning || '{"engines":[],"explanation":""}');
  const steps = JSON.parse(decision.actionSteps || "[]");

  const priorityColor = decision.priority <= 2 ? "var(--color-danger, #ef4444)" : decision.priority <= 3 ? "var(--color-warning, #f59e0b)" : "var(--color-muted, #94a3b8)";
  const confidenceColor = decision.confidence >= 0.7 ? "var(--color-success, #22c55e)" : decision.confidence >= 0.4 ? "var(--color-warning, #f59e0b)" : "var(--color-danger, #ef4444)";

  return (
    <div style={{ padding: "1.25rem", background: "var(--color-surface, #1e293b)", borderRadius: "0.75rem", border: "1px solid var(--color-border, #334155)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "0.75rem", padding: "0.125rem 0.375rem", borderRadius: "0.25rem", background: priorityColor + "20", color: priorityColor, fontWeight: 600, textTransform: "uppercase" }}>
              P{decision.priority}
            </span>
            <span style={{ fontSize: "0.75rem", padding: "0.125rem 0.375rem", borderRadius: "0.25rem", background: "var(--color-bg, #0f172a)", color: "var(--color-muted, #94a3b8)" }}>
              {decision.category}
            </span>
            <span style={{ fontSize: "0.75rem", padding: "0.125rem 0.375rem", borderRadius: "0.25rem", background: confidenceColor + "20", color: confidenceColor }}>
              {Math.round(decision.confidence * 100)}% confidence
            </span>
          </div>
          <h3 style={{ margin: "0.25rem 0 0.125rem", fontSize: "1rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>{decision.title}</h3>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-muted, #94a3b8)" }}>{decision.observation}</p>
        </div>
        <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
          {decision.status === "pending" && (
            <>
              <button onClick={() => onAccept(decision.id)} style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", border: "none", background: "var(--color-success, #22c55e)", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "0.75rem" }}>Accept</button>
              <button onClick={() => onDismiss(decision.id)} style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", border: "1px solid var(--color-border, #334155)", background: "transparent", color: "var(--color-muted, #94a3b8)", cursor: "pointer", fontSize: "0.75rem" }}>Dismiss</button>
            </>
          )}
          {decision.status === "accepted" && (
            <button onClick={() => onComplete(decision.id)} style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", border: "none", background: "var(--color-primary, #3b82f6)", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "0.75rem" }}>Mark Complete</button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem", fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>
        <span>Impact: <strong style={{ color: "var(--color-text, #f1f5f9)" }}>{decision.businessImpact}</strong></span>
        <span>Effort: <strong style={{ color: "var(--color-text, #f1f5f9)" }}>{decision.effort}</strong></span>
        <span>Status: <strong style={{ color: decision.status === "completed" ? "var(--color-success, #22c55e)" : decision.status === "accepted" ? "var(--color-primary, #3b82f6)" : "var(--color-muted, #94a3b8)" }}>{decision.status}</strong></span>
      </div>

      {/* Evidence section */}
      {evidence.length > 0 && (
        <details style={{ marginBottom: "0.5rem" }}>
          <summary style={{ fontSize: "0.8125rem", color: "var(--color-primary, #3b82f6)", cursor: "pointer", fontWeight: 500 }}>Evidence ({evidence.length})</summary>
          <div style={{ marginTop: "0.5rem", padding: "0.5rem", background: "var(--color-bg, #0f172a)", borderRadius: "0.375rem" }}>
            {evidence.map((e: any, i: number) => (
              <p key={i} style={{ margin: "0.25rem 0", fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>
                • {e.source || e.type || e.description || JSON.stringify(e)}
              </p>
            ))}
          </div>
        </details>
      )}

      {/* Reasoning section */}
      {reasoning.explanation && (
        <details>
          <summary style={{ fontSize: "0.8125rem", color: "var(--color-primary, #3b82f6)", cursor: "pointer", fontWeight: 500 }}>Reasoning</summary>
          <div style={{ marginTop: "0.5rem", padding: "0.5rem", background: "var(--color-bg, #0f172a)", borderRadius: "0.375rem" }}>
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>{reasoning.explanation}</p>
            {reasoning.engines?.length > 0 && (
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>Engines: {reasoning.engines.join(", ")}</p>
            )}
          </div>
        </details>
      )}

      {/* Action steps */}
      {steps.length > 0 && decision.status !== "completed" && (
        <div style={{ marginTop: "0.75rem", padding: "0.5rem", background: "var(--color-bg, #0f172a)", borderRadius: "0.375rem" }}>
          <p style={{ margin: "0 0 0.25rem", fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)", fontWeight: 600 }}>Action Steps:</p>
          {steps.map((s: string, i: number) => (
            <p key={i} style={{ margin: "0.125rem 0", fontSize: "0.75rem", color: "var(--color-text, #f1f5f9)" }}>{i + 1}. {s}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DecisionQueue({ restaurantId }: { restaurantId: string }) {
  const { token } = useAuth();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [stats, setStats] = useState<DecisionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  const fetchDecisions = async () => {
    if (!token) return;
    const url = filter ? `${API}/api/restaurants/${restaurantId}/decisions?status=${filter}` : `${API}/api/restaurants/${restaurantId}/decisions`;
    const [dRes, sRes] = await Promise.all([
      fetch(url, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/api/restaurants/${restaurantId}/decision-stats`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (dRes.ok) { const d = await dRes.json(); setDecisions(d.data || []); }
    if (sRes.ok) { const s = await sRes.json(); setStats(s.data); }
    setLoading(false);
  };

  useEffect(() => { fetchDecisions(); }, [token, restaurantId, filter]);

  const handleAction = async (id: string, action: string) => {
    if (!token) return;
    await fetch(`${API}/api/decisions/${id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ restaurantId }),
    });
    fetchDecisions();
  };

  if (loading) return <p style={{ color: "var(--color-muted, #94a3b8)" }}>Loading decisions...</p>;

  return (
    <div>
      {stats && (
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <div style={{ padding: "0.75rem 1rem", background: "var(--color-surface, #1e293b)", borderRadius: "0.5rem", border: "1px solid var(--color-border, #334155)" }}>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>Total</p>
            <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text, #f1f5f9)" }}>{stats.total}</p>
          </div>
          <div style={{ padding: "0.75rem 1rem", background: "var(--color-surface, #1e293b)", borderRadius: "0.5rem", border: "1px solid var(--color-border, #334155)" }}>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>Acceptance</p>
            <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--color-success, #22c55e)" }}>{stats.acceptanceRate}%</p>
          </div>
          <div style={{ padding: "0.75rem 1rem", background: "var(--color-surface, #1e293b)", borderRadius: "0.5rem", border: "1px solid var(--color-border, #334155)" }}>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)" }}>Completed</p>
            <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--color-primary, #3b82f6)" }}>{stats.completed}</p>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {["", "pending", "accepted", "completed", "dismissed"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", border: "1px solid var(--color-border, #334155)", background: filter === s ? "var(--color-primary, #3b82f6)" : "transparent", color: filter === s ? "#fff" : "var(--color-muted, #94a3b8)", cursor: "pointer", fontSize: "0.75rem", fontWeight: filter === s ? 600 : 400 }}>
            {s || "All"}
          </button>
        ))}
      </div>

      {decisions.length === 0 ? (
        <p style={{ color: "var(--color-muted, #94a3b8)", textAlign: "center", padding: "2rem" }}>No decisions yet. Run an analysis to get started.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {decisions.map(d => (
            <DecisionCard key={d.id} decision={d} onAccept={(id) => handleAction(id, "accept")} onDismiss={(id) => handleAction(id, "dismiss")} onComplete={(id) => handleAction(id, "complete")} />
          ))}
        </div>
      )}
    </div>
  );
}
