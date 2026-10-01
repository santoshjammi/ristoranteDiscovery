"use client";

import { PublicLayout } from "@/components/shared/PublicLayout";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import Link from 'next/link';

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "/month",
    desc: "Get started with basic restaurant intelligence",
    features: ["1 restaurant", "Basic visibility score", "Monthly report", "Email support"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Starter",
    price: "₹999",
    period: "/month",
    desc: "For independent restaurant owners",
    features: ["3 restaurants", "Full intelligence scorecard", "Weekly reports", "Priority support", "Recommendation engine"],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Professional",
    price: "₹2,999",
    period: "/month",
    desc: "For multi-location restaurants",
    features: ["10 restaurants", "Competitor analysis", "Review intelligence", "API access", "Dedicated support", "Custom reports"],
    cta: "Contact Sales",
    popular: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For restaurant groups and chains",
    features: ["Unlimited restaurants", "White-label reports", "Custom integrations", "SLA guarantee", "Account manager", "Training"],
    cta: "Contact Us",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <PublicLayout>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: `${spacing["4xl"]} ${spacing.xl}` }}>
        <div style={{ textAlign: "center", marginBottom: spacing["3xl"] }}>
          <h1 style={{ ...typography.h1, fontSize: "2rem", margin: `0 0 ${spacing.md}` }}>Simple, Transparent Pricing</h1>
          <p style={{ ...typography.body, color: colors.mutedDarker, maxWidth: 500, margin: "0 auto" }}>Start free and upgrade as your restaurant intelligence needs grow.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: spacing.lg }}>
          {plans.map((plan) => (
            <div key={plan.name} style={{ padding: spacing.xl, background: plan.popular ? colors.primaryLight : colors.surface, borderRadius: radius.xl, border: `1px solid ${plan.popular ? colors.primary : colors.border}`, position: "relative" }}>
              {plan.popular && <span style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", padding: `${spacing.xs} ${spacing.lg}`, borderRadius: radius.full, background: colors.primary, color: "#fff", fontSize: "0.75rem", fontWeight: 600 }}>Most Popular</span>}
              <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.xs}` }}>{plan.name}</h3>
              <p style={{ margin: `0 0 ${spacing.sm}`, fontSize: "2rem", fontWeight: 700, color: colors.text }}>{plan.price}<span style={{ fontSize: "0.875rem", color: colors.mutedDarker }}>{plan.period}</span></p>
              <p style={{ ...typography.small, margin: `0 0 ${spacing.lg}`, color: colors.mutedDarker }}>{plan.desc}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: `0 0 ${spacing.xl}`, display: "flex", flexDirection: "column", gap: spacing.sm }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ ...typography.small, color: colors.muted, display: "flex", alignItems: "center", gap: spacing.sm }}>
                    <span style={{ color: colors.success }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth" style={{ display: "block", textAlign: "center", padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.md, background: plan.popular ? colors.primary : "transparent", border: `1px solid ${plan.popular ? colors.primary : colors.border}`, color: plan.popular ? "#fff" : colors.text, textDecoration: "none", fontWeight: 600, fontSize: "0.875rem" }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
