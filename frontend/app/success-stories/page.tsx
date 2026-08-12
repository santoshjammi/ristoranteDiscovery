"use client";

import { PublicLayout } from "@/components/shared/PublicLayout";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";

const stories = [
  { name: "Biryani Maxx", location: "Morrisville, NC", metric: "+58%", label: "visibility increase", quote: "The intelligence scorecard showed us exactly where we were losing customers. Within 2 weeks, our online visibility improved by 58%.", owner: "Rajesh K." },
  { name: "Dharani", location: "Cary, NC", metric: "+42%", label: "more online orders", quote: "We didn't realize our menu wasn't showing up in AI search results. The platform identified the issue and gave us step-by-step fixes.", owner: "Priya S." },
  { name: "FitFuel Kitchen", location: "Morrisville, NC", metric: "+35%", label: "new customer growth", quote: "As a cloud kitchen, visibility is everything. This platform helped us dominate local search results.", owner: "Arun M." },
  { name: "Brew & Bean", location: "Chapel Hill, NC", metric: "+28%", label: "review response rate", quote: "The review intelligence feature helped us understand what customers really want. Our rating went from 3.8 to 4.3.", owner: "Sarah L." },
];

export default function SuccessStoriesPage() {
  return (
    <PublicLayout>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: `${spacing["4xl"]} ${spacing.xl}` }}>
        <div style={{ textAlign: "center", marginBottom: spacing["3xl"] }}>
          <h1 style={{ ...typography.h1, fontSize: "2rem", margin: `0 0 ${spacing.md}` }}>Customer Success Stories</h1>
          <p style={{ ...typography.body, color: colors.mutedDarker, maxWidth: 500, margin: "0 auto" }}>Real restaurants, real results. See how restaurant owners are using intelligence to grow their business.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.xl }}>
          {stories.map((s) => (
            <div key={s.name} style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.md }}>
                <div>
                  <h3 style={{ ...typography.h3, margin: 0 }}>{s.name}</h3>
                  <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{s.location}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: "2rem", fontWeight: 700, color: colors.success }}>{s.metric}</p>
                  <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker }}>{s.label}</p>
                </div>
              </div>
              <p style={{ ...typography.body, margin: `0 0 ${spacing.md}`, color: colors.muted, fontStyle: "italic", lineHeight: 1.6 }}>"{s.quote}"</p>
              <p style={{ ...typography.small, margin: 0, color: colors.mutedDarker }}>— {s.owner}</p>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
