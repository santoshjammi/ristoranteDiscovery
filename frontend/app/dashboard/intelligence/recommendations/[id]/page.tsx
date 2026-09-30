"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { colors, spacing, radius, typography, scoreColor, severityColor, severityLabel } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

import { API } from "@/app/lib/api-config";

interface DecisionDetail {
  id: string;
  title: string;
  description: string;
  priority: string;
  confidence: number;
  businessImpact: string;
  effort: string;
  expectedTime: string;
  category: string;
  status: string;
  evidence: string;
  reasoning: string;
  engines: string[];
  actionSteps: string[];
  owner: string | null;
  dueDate: string | null;
  createdAt: string;
  restaurantId: string;
  restaurantName: string;
}

function RecommendationDetailPage() {
  const { token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [decision, setDecision] = useState<DecisionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    if (!token || !params.id) return;
    setLoading(true);
    setError("");
    fetch(`${API}/api/decisions/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load recommendation");
        return r.json();
      })
      .then((data) => setDecision(data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, params.id]);

  const handleAction = async (action: "accept" | "dismiss" | "complete") => {
    if (!token || !decision) return;
    setActioning(true);
    try {
      const res = await fetch(`${API}/api/decisions/${decision.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ restaurantId: decision.restaurantId }),
      });
      if (!res.ok) throw new Error(`Failed to ${action}`);
      setDecision((prev) => prev ? { ...prev, status: action === "accept" ? "accepted" : action === "dismiss" ? "dismissed" : "completed" } : prev);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActioning(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <LoadingSkeleton count={1} height="1.5rem" width="50%" />
        <div style={{ marginTop: spacing.xl }}>
          <LoadingSkeleton count={6} height="1rem" width="100%" />
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ padding: spacing["3xl"], textAlign: "center", background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.dangerLight}` }}>
          <p style={{ fontSize: "1rem", color: colors.danger, margin: `0 0 ${spacing.sm}` }}>Failed to load recommendation</p>
          <p style={{ ...typography.small, margin: `0 0 ${spacing.lg}` }}>{error}</p>
          <button onClick={() => router.back()} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer", fontSize: "0.8125rem" }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!decision) return null;

  const priorityColor = severityColor(decision.priority);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* Back link */}
      <button onClick={() => router.back()} style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", fontSize: "0.8125rem", padding: 0, marginBottom: spacing.lg, display: "flex", alignItems: "center", gap: spacing.xs }}>
        ← Back to Recommendations
      </button>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing["2xl"] }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm }}>
            <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.full, fontSize: "0.75rem", fontWeight: 600, background: `${priorityColor}20`, color: priorityColor }}>
              {severityLabel(decision.priority)} Priority
            </span>
            <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.full, fontSize: "0.75rem", fontWeight: 600, background: `${colors.primaryLight}`, color: colors.primary }}>
              {decision.category}
            </span>
            <StatusBadge status={decision.status} />
          </div>
          <h1 style={{ ...typography.h1, margin: 0 }}>{decision.title}</h1>
          <p style={{ ...typography.small, margin: `${spacing.sm} 0 0`, color: colors.mutedDarker }}>
            {decision.restaurantName} · Generated {new Date(decision.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Description */}
      <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, marginBottom: spacing.xl }}>
        <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.sm}` }}>Problem</h3>
        <p style={{ ...typography.body, margin: 0, lineHeight: 1.6 }}>{decision.description}</p>
      </div>

      {/* Evidence */}
      <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, marginBottom: spacing.xl }}>
        <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.sm}` }}>Evidence</h3>
        <p style={{ ...typography.body, margin: 0, lineHeight: 1.6, color: colors.textSecondary }}>{decision.evidence}</p>
      </div>

      {/* Reasoning */}
      <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, marginBottom: spacing.xl }}>
        <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.sm}` }}>Reasoning</h3>
        <p style={{ ...typography.body, margin: `0 0 ${spacing.md}`, lineHeight: 1.6, color: colors.textSecondary }}>{decision.reasoning}</p>
        {decision.engines && decision.engines.length > 0 && (
          <div>
            <p style={{ ...typography.caption, margin: `0 0 ${spacing.xs}`, fontWeight: 600 }}>Intelligence Engines</p>
            <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap" }}>
              {decision.engines.map((engine, i) => (
                <span key={i} style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.sm, background: colors.primaryLight, color: colors.primary, fontSize: "0.75rem", fontWeight: 500 }}>
                  {engine}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Impact & Effort */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: spacing.md, marginBottom: spacing.xl }}>
        <MetricCard label="Business Impact" value={decision.businessImpact} />
        <MetricCard label="Effort" value={decision.effort} />
        <MetricCard label="Confidence" value={`${decision.confidence}%`} color={scoreColor(decision.confidence)} />
      </div>

      {/* Action Plan */}
      {decision.actionSteps && decision.actionSteps.length > 0 && (
        <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, marginBottom: spacing.xl }}>
          <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.md}` }}>Action Plan</h3>
          <ol style={{ margin: 0, paddingLeft: spacing.xl }}>
            {decision.actionSteps.map((step, i) => (
              <li key={i} style={{ ...typography.body, marginBottom: spacing.sm, lineHeight: 1.5, color: colors.textSecondary }}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Decision Buttons */}
      <div style={{ display: "flex", gap: spacing.md, marginBottom: spacing["3xl"] }}>
        {decision.status === "pending" && (
          <>
            <button onClick={() => handleAction("accept")} disabled={actioning} style={{ padding: `${spacing.md} ${spacing["2xl"]}`, borderRadius: radius.md, border: "none", background: actioning ? colors.muted : colors.success, color: "#fff", fontWeight: 600, cursor: actioning ? "not-allowed" : "pointer", fontSize: "0.875rem" }}>
              {actioning ? "Processing..." : "✅ Accept"}
            </button>
            <button onClick={() => handleAction("dismiss")} disabled={actioning} style={{ padding: `${spacing.md} ${spacing["2xl"]}`, borderRadius: radius.md, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: actioning ? "not-allowed" : "pointer", fontSize: "0.875rem" }}>
              Dismiss
            </button>
          </>
        )}
        {decision.status === "accepted" && (
          <button onClick={() => handleAction("complete")} disabled={actioning} style={{ padding: `${spacing.md} ${spacing["2xl"]}`, borderRadius: radius.md, border: "none", background: actioning ? colors.muted : colors.primary, color: "#fff", fontWeight: 600, cursor: actioning ? "not-allowed" : "pointer", fontSize: "0.875rem" }}>
            {actioning ? "Processing..." : "Mark Complete"}
          </button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: colors.muted },
    accepted: { label: "Accepted", color: colors.success },
    dismissed: { label: "Dismissed", color: colors.mutedDarker },
    completed: { label: "Completed", color: colors.primary },
  };
  const s = map[status] || { label: status, color: colors.muted };
  return (
    <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.full, fontSize: "0.75rem", fontWeight: 600, background: `${s.color}20`, color: s.color }}>
      {s.label}
    </span>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
      <p style={{ ...typography.label, margin: 0 }}>{label}</p>
      <p style={{ margin: `${spacing.xs} 0 0`, fontSize: "1.25rem", fontWeight: 700, color: color || colors.text }}>{value}</p>
    </div>
  );
}

export default function RecommendationDetail() {
  return <AuthProvider><RecommendationDetailPage /></AuthProvider>;
}
