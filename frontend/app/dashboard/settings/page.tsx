"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";

const settingsTabs = [
  { id: "organization", label: "Organization", href: "/dashboard/settings" },
  { id: "billing", label: "Billing", href: "/dashboard/settings/billing" },
  { id: "notifications", label: "Notifications", href: "/dashboard/settings/notifications" },
  { id: "integrations", label: "Integrations", href: "/dashboard/settings/integrations" },
  { id: "preferences", label: "Preferences", href: "/dashboard/settings/preferences" },
];

function SettingsLayout({ children, activeTab }: { children: React.ReactNode; activeTab: string }) {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Settings</h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing["2xl"]}`, color: colors.mutedDarker }}>Manage your account and organization settings</p>
      <div style={{ display: "flex", gap: spacing.xs, marginBottom: spacing.xl, borderBottom: `1px solid ${colors.border}`, paddingBottom: spacing.sm, overflowX: "auto" }}>
        {settingsTabs.map((tab) => (
          <Link key={tab.id} href={tab.href} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: `${radius.md} ${radius.md} 0 0`, border: "none", background: activeTab === tab.id ? colors.surface : "transparent", color: activeTab === tab.id ? colors.text : colors.muted, cursor: "pointer", fontSize: "0.875rem", fontWeight: activeTab === tab.id ? 600 : 400, whiteSpace: "nowrap", textDecoration: "none" }}>
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}

function OrganizationSettings() {
  const { user, organization, organizations, switchOrganization, createOrganization } = useAuth();
  const [newOrgName, setNewOrgName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newOrgName.trim()) return;
    setCreating(true);
    try {
      await createOrganization(newOrgName);
      setNewOrgName("");
    } catch {} finally { setCreating(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.xl }}>
      <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
        <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.md}` }}>Current Organization</h3>
        <p style={{ ...typography.body, margin: 0 }}>{organization?.name || "No organization"}</p>
      </div>

      {organizations && organizations.length > 1 && (
        <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
          <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.md}` }}>Switch Organization</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            {organizations.filter((o: any) => o.id !== organization?.id).map((o: any) => (
              <button key={o.id} onClick={() => switchOrganization(o)} style={{ padding: `${spacing.sm} ${spacing.md}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer", fontSize: "0.8125rem", textAlign: "left" }}>
                Switch to {o.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
        <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.md}` }}>Create Organization</h3>
        <div style={{ display: "flex", gap: spacing.md }}>
          <input placeholder="Organization name" value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} style={{ flex: 1, padding: spacing.sm, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: "0.875rem" }} />
          <button onClick={handleCreate} disabled={creating || !newOrgName.trim()} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: "none", background: creating ? colors.muted : colors.primary, color: "#fff", fontWeight: 600, cursor: creating ? "not-allowed" : "pointer", fontSize: "0.875rem" }}>
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BillingSettings() {
  return (
    <div style={{ padding: spacing["3xl"], textAlign: "center", background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
      <p style={{ fontSize: "2rem", margin: `0 0 ${spacing.lg}` }}>💳</p>
      <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.sm}` }}>Billing</h3>
      <p style={{ ...typography.small, margin: `0 0 ${spacing.xl}`, color: colors.muted }}>Manage your subscription and billing information.</p>
      <p style={{ ...typography.small, margin: 0, color: colors.mutedDarker }}>Current plan: Free · Upgrade to access premium features.</p>
    </div>
  );
}

function NotificationsSettings() {
  const toggles = [
    { key: "analysis_complete", label: "Analysis Complete", desc: "When a restaurant analysis finishes" },
    { key: "weekly_report", label: "Weekly Report", desc: "Weekly intelligence summary" },
    { key: "recommendations", label: "New Recommendations", desc: "When new recommendations are generated" },
    { key: "team_invites", label: "Team Invites", desc: "When someone joins your team" },
    { key: "audit_complete", label: "Audit Complete", desc: "When a visibility audit finishes" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
      {toggles.map((t) => (
        <div key={t.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
          <div>
            <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 500, color: colors.text }}>{t.label}</p>
            <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{t.desc}</p>
          </div>
          <div style={{ width: 44, height: 24, borderRadius: radius.full, background: colors.primary, cursor: "pointer", position: "relative" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", right: 2, top: 2 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function IntegrationsSettings() {
  const integrations = [
    { name: "Google Business Profile", icon: "🏪", desc: "Connect your GBP for review and visibility data", connected: false },
    { name: "Google Analytics", icon: "📊", desc: "Track website traffic and user behavior", connected: false },
    { name: "Zomato", icon: "🍽️", desc: "Import menu and review data from Zomato", connected: false },
    { name: "Swiggy", icon: "🛵", desc: "Connect Swiggy for delivery insights", connected: false },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
      {integrations.map((i) => (
        <div key={i.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
            <span style={{ fontSize: "1.5rem" }}>{i.icon}</span>
            <div>
              <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 500, color: colors.text }}>{i.name}</p>
              <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{i.desc}</p>
            </div>
          </div>
          <button style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.primary}`, background: "transparent", color: colors.primary, cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500 }}>
            {i.connected ? "Connected" : "Connect"}
          </button>
        </div>
      ))}
    </div>
  );
}

function PreferencesSettings() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
      <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
        <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.md}` }}>Display Preferences</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: "0.875rem", color: colors.text }}>Default Dashboard View</p>
            <select style={{ padding: spacing.sm, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: "0.8125rem" }}>
              <option>Overview</option>
              <option>Restaurants</option>
              <option>Intelligence</option>
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: "0.875rem", color: colors.text }}>Items Per Page</p>
            <select style={{ padding: spacing.sm, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: "0.8125rem" }}>
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  const pathname = usePathname();
  const activeTab = pathname.split("/").pop() || "organization";

  const content = () => {
    switch (activeTab) {
      case "billing": return <BillingSettings />;
      case "notifications": return <NotificationsSettings />;
      case "integrations": return <IntegrationsSettings />;
      case "preferences": return <PreferencesSettings />;
      default: return <OrganizationSettings />;
    }
  };

  return <SettingsLayout activeTab={activeTab}>{content()}</SettingsLayout>;
}

export default function Settings() { return <AuthProvider><SettingsPage /></AuthProvider>; }
