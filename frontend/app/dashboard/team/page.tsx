"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

import { API } from "@/app/lib/api-config";

function InviteForm({ inviteEmail, setInviteEmail, inviteRole, setInviteRole, inviting, inviteError, onSubmit }: {
  inviteEmail: string; setInviteEmail: (v: string) => void;
  inviteRole: string; setInviteRole: (v: string) => void;
  inviting: boolean; inviteError: string;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} style={{ display: "flex", gap: spacing.md, alignItems: "flex-end", marginBottom: spacing["2xl"], padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ ...typography.label, margin: `0 0 ${spacing.xs}`, color: colors.mutedDarker }}>Invite Member</p>
        <input placeholder="Email address" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required style={{ width: "100%", padding: spacing.sm, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: "0.875rem", boxSizing: "border-box" }} />
      </div>
      <div>
        <p style={{ ...typography.label, margin: `0 0 ${spacing.xs}`, color: colors.mutedDarker }}>Role</p>
        <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={{ padding: spacing.sm, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: "0.875rem", cursor: "pointer" }}>
          <option value="member">Member</option>
          <option value="admin">Admin</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>
      <button type="submit" disabled={inviting} style={{ padding: `${spacing.sm} ${spacing.xl}`, borderRadius: radius.sm, border: "none", background: inviting ? colors.muted : colors.primary, color: "#fff", fontWeight: 600, cursor: inviting ? "not-allowed" : "pointer", fontSize: "0.875rem", whiteSpace: "nowrap" }}>
        {inviting ? "Inviting..." : "Send Invite"}
      </button>
      {inviteError && <p style={{ color: colors.danger, fontSize: "0.8125rem", margin: 0, width: "100%" }}>{inviteError}</p>}
    </form>
  );
}

function TeamPage() {
  const { token, organization } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const fetchMembers = async () => {
    if (!token || !organization) { setLoading(false); return; }
    setError("");
    try {
      const res = await fetch(`${API}/api/organizations/${organization.id}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load members");
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : data.data || data.members || []);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, [token, organization]);

  const inviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !organization) return;
    setInviteError("");
    setInviting(true);
    try {
      const res = await fetch(`${API}/api/organizations/${organization.id}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to invite"); }
      setInviteEmail("");
      fetchMembers();
    } catch (err: any) { setInviteError(err.message); }
    finally { setInviting(false); }
  };

  const removeMember = async (memberId: string) => {
    if (!token || !organization || !confirm("Remove this member?")) return;
    try {
      await fetch(`${API}/api/organizations/${organization.id}/members/${memberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMembers();
    } catch {}
  };

  if (loading) return <div style={{ maxWidth: 800, margin: "0 auto" }}><LoadingSkeleton count={5} height="4rem" width="100%" /></div>;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Team</h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing["2xl"]}`, color: colors.mutedDarker }}>Manage your team members and invitations</p>

      <InviteForm inviteEmail={inviteEmail} setInviteEmail={setInviteEmail} inviteRole={inviteRole} setInviteRole={setInviteRole} inviting={inviting} inviteError={inviteError} onSubmit={inviteMember} />

      {error ? (
        <div style={{ padding: spacing["3xl"], textAlign: "center", background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.dangerLight}` }}>
          <p style={{ fontSize: "1rem", color: colors.danger, margin: `0 0 ${spacing.sm}` }}>Failed to load team</p>
          <button onClick={fetchMembers} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer", fontSize: "0.8125rem" }}>Retry</button>
        </div>
      ) : members.length === 0 ? (
        <div style={{ textAlign: "center", padding: spacing["4xl"], background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: "2rem", margin: `0 0 ${spacing.lg}` }}>👥</p>
          <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.sm}` }}>No team members yet</h3>
          <p style={{ ...typography.small, margin: 0, color: colors.muted }}>Invite members to collaborate on restaurant intelligence.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {members.map((m: any) => (
            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
              <div>
                <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: colors.text }}>{m.name || m.email}</p>
                <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{m.email} · {m.role || "member"}</p>
              </div>
              <button onClick={() => removeMember(m.id)} style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.sm, border: `1px solid ${colors.danger}40`, background: "transparent", color: colors.danger, cursor: "pointer", fontSize: "0.75rem" }}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Team() { return <AuthProvider><TeamPage /></AuthProvider>; }
