"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import Link from "next/link";

const sections = [
  { id: "local-market", icon: "📍", title: "Local Market", desc: "Market overview, demographics, and competition density in your area", href: "/dashboard/discover/local-market" },
  { id: "trending-searches", icon: "📈", title: "Trending Searches", desc: "What customers are searching for in your area", href: "/dashboard/discover/trending-searches" },
  { id: "competitor-activity", icon: "🏆", title: "Competitor Activity", desc: "Competitor movements, new openings, and market changes", href: "/dashboard/discover/competitor-activity" },
  { id: "opportunities", icon: "💡", title: "Opportunities", desc: "Growth opportunities and market gaps to explore", href: "/dashboard/discover/opportunities" },
  { id: "seasonal-trends", icon: "📅", title: "Seasonal Trends", desc: "Seasonal patterns and timing for your market", href: "/dashboard/discover/seasonal-trends" },
];

function DiscoverPage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Discover</h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing["2xl"]}`, color: colors.mutedDarker }}>Market intelligence and growth opportunities</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: spacing.lg }}>
        {sections.map((s) => (
          <Link key={s.id} href={s.href} style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}`, textDecoration: "none", transition: "border-color 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.primary }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border }}>
            <p style={{ fontSize: "2rem", margin: `0 0 ${spacing.md}` }}>{s.icon}</p>
            <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.xs}` }}>{s.title}</h3>
            <p style={{ ...typography.small, margin: 0, color: colors.mutedDarker }}>{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Discover() { return <AuthProvider><DiscoverPage /></AuthProvider>; }
