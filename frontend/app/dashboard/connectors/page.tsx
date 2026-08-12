"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8040";

interface Connector {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: string;
  status: 'disconnected' | 'connected' | 'error' | 'not_configured';
  lastSyncAt: string | null;
  lastError: string | null;
}

function ConnectorsPage() {
  const { token } = useAuth();
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const fetchConnectors = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/connectors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setConnectors(Array.isArray(data.data) ? data.data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchConnectors();
    else setLoading(false);
  }, [token]);

  const handleConnect = async (type: string) => {
    if (!token) return;
    setSyncing(type);
    setSyncResult(null);
    try {
      const res = await fetch(`${API}/api/connectors/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, label: type === 'gbp' ? 'Google Business Profile' : type, credentials: {} }),
      });
      if (!res.ok) throw new Error("Failed to connect");
      setSyncResult(`${type} connected successfully!`);
      await fetchConnectors();
    } catch (err: any) {
      setSyncResult(`Error: ${err.message}`);
    } finally {
      setSyncing(null);
    }
  };

  const handleSync = async (type: string) => {
    if (!token) return;
    setSyncing(type);
    setSyncResult(null);
    try {
      const res = await fetch(`${API}/api/connectors/${type}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to sync");
      setSyncResult(`${type} synced successfully! Scorecard updated.`);
      await fetchConnectors();
    } catch (err: any) {
      setSyncResult(`Error: ${err.message}`);
    } finally {
      setSyncing(null);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'connected': return colors.success;
      case 'error': return colors.danger;
      case 'disconnected': return colors.muted;
      default: return colors.mutedDarker;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'error': return 'Error';
      case 'disconnected': return 'Disconnected';
      default: return 'Not Configured';
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Connectors</h1>
        <LoadingSkeleton count={3} height="6rem" width="100%" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Connectors</h1>
        <div style={{ padding: spacing["3xl"], textAlign: "center", background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.dangerLight}` }}>
          <p style={{ fontSize: "1rem", color: colors.danger, margin: 0 }}>Failed to load connectors</p>
          <p style={{ ...typography.small, margin: `${spacing.sm} 0 ${spacing.lg}`, color: colors.muted }}>{error}</p>
          <button onClick={fetchConnectors} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer" }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Connectors</h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing["2xl"]}`, color: colors.muted }}>
        Connect external platforms to populate scorecard factors and unlock insights.
      </p>

      {syncResult && (
        <div style={{ padding: spacing.md, marginBottom: spacing.lg, background: syncResult.startsWith('Error') ? colors.dangerLight : '#0a3d0a', borderRadius: radius.md, border: `1px solid ${syncResult.startsWith('Error') ? colors.danger : colors.success}`, color: syncResult.startsWith('Error') ? colors.danger : colors.success, fontSize: "0.875rem" }}>
          {syncResult}
        </div>
      )}

      {connectors.length === 0 ? (
        <div style={{ textAlign: "center", padding: spacing["4xl"], background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: "2rem", margin: `0 0 ${spacing.lg}` }}>🔌</p>
          <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.sm}` }}>No connectors available</h3>
          <p style={{ ...typography.small, margin: 0, color: colors.muted }}>Connectors will appear here once the platform is configured.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {connectors.map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs }}>
                  <span style={{ fontSize: "1.5rem" }}>{c.icon}</span>
                  <h3 style={{ ...typography.h3, margin: 0 }}>{c.name}</h3>
                  <span style={{ fontSize: "0.75rem", padding: `2px ${spacing.sm}`, borderRadius: radius.sm, background: statusColor(c.status), color: "#fff", fontWeight: 500 }}>
                    {statusLabel(c.status)}
                  </span>
                </div>
                <p style={{ ...typography.small, margin: 0, color: colors.muted }}>{c.description}</p>
                {c.lastSyncAt && (
                  <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>
                    Last synced: {new Date(c.lastSyncAt).toLocaleString()}
                  </p>
                )}
                {c.lastError && (
                  <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.danger }}>
                    Error: {c.lastError}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: spacing.sm, alignItems: "center" }}>
                {c.status === 'not_configured' ? (
                  <button onClick={() => handleConnect(c.type)} disabled={syncing === c.type} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: "none", background: colors.primary, color: "#fff", cursor: "pointer", fontSize: "0.8125rem", opacity: syncing === c.type ? 0.6 : 1 }}>
                    {syncing === c.type ? "Connecting..." : "Connect"}
                  </button>
                ) : (
                  <button onClick={() => handleSync(c.type)} disabled={syncing === c.type} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer", fontSize: "0.8125rem", opacity: syncing === c.type ? 0.6 : 1 }}>
                    {syncing === c.type ? "Syncing..." : "Sync Now"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Connectors() {
  return <AuthProvider><ConnectorsPage /></AuthProvider>;
}
