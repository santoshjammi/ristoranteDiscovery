"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/lib/auth-context";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8040";

export default function ConnectDataPanel({ restaurantId }: { restaurantId: string }) {
  const { token } = useAuth();
  const [sources, setSources] = useState<any[]>([]);
  const [gbpUrl, setGbpUrl] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSources = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/restaurants/${restaurantId}/connect/sources`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setSources(d.data || []); }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchSources(); }, [token, restaurantId]);

  const scanWebsite = async () => {
    if (!token) return;
    setStatus("Scanning website...");
    const res = await fetch(`${API}/api/restaurants/${restaurantId}/connect/website`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { setStatus("Website scan complete"); fetchSources(); }
    else setStatus("Scan failed");
  };

  const connectGBP = async () => {
    if (!token || !gbpUrl) return;
    setStatus("Connecting GBP...");
    const res = await fetch(`${API}/api/restaurants/${restaurantId}/connect/gbp`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ gbpUrl }),
    });
    if (res.ok) { setStatus("GBP connected"); fetchSources(); }
    else setStatus("Connection failed");
  };

  if (loading) return <p style={{ color: "var(--color-muted, #94a3b8)", fontSize: "0.875rem" }}>Loading sources...</p>;

  return (
    <div style={{ padding: "1.25rem", background: "var(--color-surface, #1e293b)", borderRadius: "0.75rem", border: "1px solid var(--color-border, #334155)" }}>
      <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>Connected Data Sources</h3>

      {sources.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          {sources.map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0.75rem", background: "var(--color-bg, #0f172a)", borderRadius: "0.375rem", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--color-text, #f1f5f9)" }}>{s.type}</span>
              <span style={{ fontSize: "0.75rem", color: s.status === "connected" ? "var(--color-success, #22c55e)" : "var(--color-muted, #94a3b8)" }}>{s.status}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <button onClick={scanWebsite} style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "none", background: "var(--color-primary, #3b82f6)", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "0.8125rem" }}>
          Scan Website
        </button>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input value={gbpUrl} onChange={e => setGbpUrl(e.target.value)} placeholder="Google Business Profile URL"
            style={{ flex: 1, padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid var(--color-border, #334155)", background: "var(--color-bg, #0f172a)", color: "var(--color-text, #f1f5f9)", fontSize: "0.8125rem" }} />
          <button onClick={connectGBP} style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "none", background: "var(--color-primary, #3b82f6)", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "0.8125rem" }}>
            Connect
          </button>
        </div>
      </div>

      {status && <p style={{ margin: "0.5rem 0 0", fontSize: "0.8125rem", color: "var(--color-muted, #94a3b8)" }}>{status}</p>}
    </div>
  );
}
