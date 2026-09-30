"use client";

import { useState } from "react";
import { useAuth } from "@/app/lib/auth-context";

import { API } from "@/app/lib/api-config";

export default function VerificationPanel({ restaurantId, onVerified }: { restaurantId: string; onVerified: () => void }) {
  const { token } = useAuth();
  const [method, setMethod] = useState<"gbp" | "domain">("gbp");
  const [domain, setDomain] = useState("");
  const [status, setStatus] = useState<{ message: string; type: "info" | "success" | "error" } | null>(null);
  const [busy, setBusy] = useState(false);

  const startVerification = async () => {
    if (!token) return;
    setBusy(true);
    setStatus(null);
    try {
      const endpoint = method === "gbp"
        ? `${API}/api/restaurants/${restaurantId}/verify/gbp`
        : `${API}/api/restaurants/${restaurantId}/verify/domain`;
      const body = method === "domain" ? { domain } : {};
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Verification failed");
      const data = await res.json();
      setStatus({ message: data.data?.message || "Verification initiated", type: "info" });
    } catch (err: any) {
      setStatus({ message: err.message, type: "error" });
    } finally { setBusy(false); }
  };

  const confirmVerification = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/restaurants/${restaurantId}/verify/confirm`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ method }),
      });
      if (!res.ok) throw new Error("Confirmation failed");
      setStatus({ message: "Ownership verified!", type: "success" });
      onVerified();
    } catch (err: any) {
      setStatus({ message: err.message, type: "error" });
    } finally { setBusy(false); }
  };

  return (
    <div style={{ padding: "1.25rem", background: "var(--color-surface, #1e293b)", borderRadius: "0.75rem", border: "1px solid var(--color-border, #334155)" }}>
      <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>Verify Ownership</h3>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {(["gbp", "domain"] as const).map(m => (
          <button key={m} onClick={() => setMethod(m)}
            style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "1px solid var(--color-border, #334155)", background: method === m ? "var(--color-primary, #3b82f6)" : "transparent", color: method === m ? "#fff" : "var(--color-muted, #94a3b8)", cursor: "pointer", fontSize: "0.8125rem", fontWeight: method === m ? 600 : 400 }}>
            {m === "gbp" ? "Google Business" : "Domain"}
          </button>
        ))}
      </div>

      {method === "domain" && (
        <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="your-restaurant.com"
          style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid var(--color-border, #334155)", background: "var(--color-bg, #0f172a)", color: "var(--color-text, #f1f5f9)", fontSize: "0.8125rem", marginBottom: "0.75rem" }} />
      )}

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={startVerification} disabled={busy}
          style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "none", background: "var(--color-primary, #3b82f6)", color: "#fff", fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", fontSize: "0.8125rem", opacity: busy ? 0.6 : 1 }}>
          {busy ? "Processing..." : "Start Verification"}
        </button>
        <button onClick={confirmVerification} disabled={busy}
          style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "1px solid var(--color-border, #334155)", background: "transparent", color: "var(--color-text, #f1f5f9)", cursor: busy ? "not-allowed" : "pointer", fontSize: "0.8125rem" }}>
          Confirm Verified
        </button>
      </div>

      {status && (
        <p style={{ margin: "0.75rem 0 0", fontSize: "0.8125rem", color: status.type === "success" ? "var(--color-success, #22c55e)" : status.type === "error" ? "var(--color-danger, #ef4444)" : "var(--color-muted, #94a3b8)" }}>
          {status.message}
        </p>
      )}
    </div>
  );
}
