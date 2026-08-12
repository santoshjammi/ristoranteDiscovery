"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";

const sections = [
  { icon: "📖", title: "Documentation", desc: "Read the full documentation for the Restaurant Intelligence Platform", links: ["Getting Started Guide", "API Reference", "Integration Guide", "FAQ"] },
  { icon: "💬", title: "Support", desc: "Get help from our support team", links: ["Email: support@ristorante.app", "Response time: < 24 hours", "Priority support for paid plans"] },
  { icon: "💡", title: "Feedback", desc: "Help us improve the platform", links: ["Feature requests", "Bug reports", "General feedback"] },
];

function HelpPage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Help</h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing["2xl"]}`, color: colors.mutedDarker }}>Documentation, support, and feedback</p>
      <div style={{ display: "flex", flexDirection: "column", gap: spacing.xl }}>
        {sections.map((s) => (
          <div key={s.title} style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: spacing.md, marginBottom: spacing.md }}>
              <span style={{ fontSize: "1.5rem" }}>{s.icon}</span>
              <div>
                <h3 style={{ ...typography.h3, margin: 0 }}>{s.title}</h3>
                <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{s.desc}</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
              {s.links.map((link) => (
                <div key={link} style={{ padding: `${spacing.sm} ${spacing.md}`, background: colors.bg, borderRadius: radius.md, cursor: "pointer" }}>
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: colors.primary }}>{link}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Help() { return <AuthProvider><HelpPage /></AuthProvider>; }
