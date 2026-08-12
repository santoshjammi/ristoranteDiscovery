"use client";

import { PublicLayout } from "@/components/shared/PublicLayout";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";

const topics = [
  { icon: "🔍", title: "Local Search", desc: "How local search works and how to optimize your presence", articles: 12 },
  { icon: "🏪", title: "Google Business", desc: "Complete guide to Google Business Profile optimization", articles: 8 },
  { icon: "⭐", title: "Reviews", desc: "Best practices for managing and responding to reviews", articles: 10 },
  { icon: "🌐", title: "Website", desc: "Website optimization tips for restaurant owners", articles: 6 },
  { icon: "👁️", title: "Visibility", desc: "Understanding and improving your online visibility", articles: 9 },
  { icon: "📈", title: "Restaurant Growth", desc: "Strategies to grow your restaurant business", articles: 7 },
];

export default function LearnPage() {
  return (
    <PublicLayout>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: `${spacing["4xl"]} ${spacing.xl}` }}>
        <div style={{ textAlign: "center", marginBottom: spacing["3xl"] }}>
          <h1 style={{ ...typography.h1, fontSize: "2rem", margin: `0 0 ${spacing.md}` }}>Learn</h1>
          <p style={{ ...typography.body, color: colors.mutedDarker, maxWidth: 500, margin: "0 auto" }}>Educational content to help you improve your restaurant's online presence.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: spacing.lg }}>
          {topics.map((topic) => (
            <div key={topic.title} style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}`, cursor: "pointer", transition: "border-color 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.primary }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border }}>
              <p style={{ fontSize: "2rem", margin: `0 0 ${spacing.md}` }}>{topic.icon}</p>
              <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.xs}` }}>{topic.title}</h3>
              <p style={{ ...typography.small, margin: `0 0 ${spacing.md}`, color: colors.mutedDarker }}>{topic.desc}</p>
              <p style={{ ...typography.caption, margin: 0, color: colors.muted }}>{topic.articles} articles</p>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
